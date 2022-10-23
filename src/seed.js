const { readdir } = require('fs/promises');
const fs = require('fs');
const path = require('path');

const getBaseDir = require('./base-dir');
const { models } = require('./sequelize');

// Initialize image types if they don't exist
const initializeImageTypes = async () => {
    // See if any image types exist
    const imageTypesInitialized = await models.imageType.findOne();

    const basePath = path.join(getBaseDir(), 'public', 'base_images')

    // if no image types exist, initialize them in database
    if (!imageTypesInitialized) {
        const imageTypeNames = [
            'people',
            'transportation',
            'popular',
            'cafe-restaurants',
            'parks-greenspace',
            'arts-education',
            'volunteering-community',
            'entertainment',
            'activities-sports',
            'holiday-travel',
            'places',
            'other'
        ];

        await models.imageType.bulkCreate(imageTypeNames.map(name => {
            return { name, location: path.join(basePath, name) }
        }));
    }

    // find all image types that don't have customized location
    const uncustomizedTypes = await models.imageType.findAll({
        where: { isCustomized: false },
    });

    // update with built-in image location in case executable was moved
    for (const type of uncustomizedTypes)
        await type.update({
            location: path.join(basePath, type.name),
        });

    // Fix image types with broken folder paths
    const imageTypes = await models.imageType.findAll();
    for (const type of imageTypes) {
        if (!fs.existsSync(type.location))
            await type.update({
                location: path.join(basePath, type.name),
                isCustomized: false,
            });
    }
};

const initializeWeekTags = async () => {
    // check if any week tags exist
    const weekTagsInitialized = await models.weekTag.findOne();

    // if not, initialize them
    if (!weekTagsInitialized) {
        await models.weekTag.bulkCreate([
            { description: 'This Week' },
            { description: 'Next Week' },
        ]);
    }
};

// Called when folder location changes
// Adds new images to the database
const writeImages = async (category) => {
    // find image type by passed in image type name (e.g. 'activities')
    const type = await models.imageType.findOne({
        raw: true,
        where: { name: category },
    });

    // Read the files inside current image type directory
    try {
        const files = await readdir(type.location);
        for (const file of files) {
            const name = file.substring(0, file.length - 4);
            const extension = file.substring(file.length - 4);

            // check if the image already exists
            const image = await models.image.findOne({
                where: { fileName: name, imageTypeId: type.id },
            });

            // if the image doesn't exist, add it to the database
            if (!image) {
                await models.image.create({
                    fileName: name,
                    fileType: extension,
                    imageTypeId: type.id,
                });
            }
        }
    } catch (err) {
        console.error(err);
    }
};

// Called from back end when app loads
// Adds new images to database from each image type
const writeAllImages = async () => {
    const types = await models.imageType.findAll();
    for (const type of types) await writeImages(type.name);
};

const setEndDates = async (weekStart) => {
    // find all weektags
    const weektags = await models.weekTag.findAll();
    // for each week tag, if end date is null, set to 7 and 14 days out respectively
    for (const weektag of weektags) {
        await weektag.update({
            endDate: new Date(weekStart.setDate(weekStart.getDate() + 7)),
        });
    }
};

// Called when app loads (should run before getImageCopies())
//    1. Checks for week passing
//    2. Deletes all image copies with 'This Week' tag
//    3. Changes image copies with 'Next Week' tag to 'This Week' tag
const updateCalendar = async () => {
    // get the current date
    const currentDate = new Date(Date.now());
    // set weekStart to previous sunday at midnight
    const weekStart = new Date();
    weekStart.setUTCDate(currentDate.getDate() - currentDate.getDay() + 1);
    weekStart.setUTCHours(0, 0, 0, 0);

    // find and assign both weektags
    const currentWeekTag = await models.weekTag.findOne({ where: { id: 1 } });
    const nextWeekTag = await models.weekTag.findOne({ where: { id: 2 } });

    // if an end date is null, set new end dates
    if (currentWeekTag.endDate === null) {
        setEndDates(weekStart);
    } else {
        // if current date is past next week end date
        if (nextWeekTag.endDate < currentDate) {
            // destroy all image copies
            await models.imageCopy.destroy({ truncate: true });
            // set new end dates
            setEndDates(weekStart);
            return;
        } else if (currentWeekTag.endDate < currentDate) {
            // destroy current week image copies
            await models.imageCopy.destroy({ where: { weekTagId: 1 } });
            // update next week image copies to this week
            await models.imageCopy.update(
                { weekTagId: 1 },
                {
                    where: {
                        weekTagId: 2,
                    },
                }
            );
            // Set current week tag's end date to next week's
            await currentWeekTag.update({ endDate: new Date(nextWeekTag.endDate) });
            // Update next week tag's end date
            const currentWeekEndDate = currentWeekTag.endDate;
            await nextWeekTag.update({
                endDate: new Date(
                    currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 7)
                ),
            });
        }
    }
};

const seed = async () => {
    await initializeWeekTags();
    await initializeImageTypes();
    await updateCalendar();
    await writeAllImages();

};

module.exports = seed;
