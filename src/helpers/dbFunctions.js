const fs = require('fs');
const { readdir } = require('fs/promises');
const path = require('path');
const Sequelize = require('sequelize');
const getBaseDir = require('../base-dir');

const { models } = require('../sequelize');

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

// Called when folder location changes
// Get all images of certain type in alphabetical order
// If the file doesn't exist anymore, delete the image and its copies
// Returns an array of image paths
const readImages = async (category) => {
	// declare image array
	const imageArray = [];

	// find image type by passed in image type name (e.g. 'activities')
	const type = await models.imageType.findOne({
		where: { name: category },
	});

	// get all images matching image type in alphabetical order
	const images = await models.image.findAll({
		order: [[Sequelize.fn('lower', Sequelize.col('fileName')), 'ASC']],
		raw: true,
		where: {
			imageTypeId: type.id,
		},
	});

	// for each image...
	for (const image of images) {
		// get the absolute path of the image
		const imagePath = path.join(type.location, image.fileName + image.fileType);
		// if image still exists, push the path onto the image path array
		if (fs.existsSync(imagePath))
			imageArray.push([imagePath, image.id, image.fileName]);
		// if image doesn't exist, destroy its copies and the image
		else {
			await models.imageCopy.destroy({
				where: { imageId: image.id },
			});
			await models.image.destroy({ where: { id: image.id } });
		}
	}

	// return the array of image paths to use as img src ref in front-end
	return imageArray;
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

// Called when...
//    Image is dragged onto calendar
//    Image copy is moved
// Takes in image or imagecopy id, posX, posY, weekTagId
const setImageCopy = async (
	copyId,
	baseId,
	thisPosX,
	thisPosY,
	thisWeekTagId
) => {
	// Try to find an already existing image copy with passed in id
	const imageCopy = await models.imageCopy.findOne({ where: { id: copyId } });

	// If one exists, update posX and posY
	if (imageCopy) {
		imageCopy.posX = thisPosX;
		imageCopy.posY = thisPosY;
		await imageCopy.save();
	} else {
		// Find image with passed in id
		const image = await models.image.findOne({ where: { id: baseId } });
		// Original image stored in activities (if popular)
		let baseImage;

		// If the image is of type "popular"
		if (image.imageTypeId === 3) {
			// check if a base image exists in "activities"
			baseImage = await models.image.findOne({
				where: {
					fileName: image.fileName,
					imageTypeId: {
						[Sequelize.Op.not]: 3,
					},
				},
			});
		}

		// if a base image exists, set to that id, otherwise set to popular id
		const imageId = baseImage ? baseImage.id : image.id;

		// Create image copy with set variables
		await models.imageCopy.create({
			id: copyId,
			posX: thisPosX,
			posY: thisPosY,
			imageId,
			weekTagId: thisWeekTagId,
		});
	}
};

// Called when an image is dragged and dropped onto the delete tab
// Deletes an image copy from the database
// Takes in image copy name
const deleteImageCopy = async (id) => {
	// Delete Image copy found by passed in array
	await models.imageCopy.destroy({ where: { id } });
};

// Called when app loads
// Get all image copies sorted by created date
const getImageCopies = async (thisWeekTagId) => {
	// declare image copy array
	const imageCopyArray = [];

	// get all images matching image type in order of created date
	const imageCopies = await models.imageCopy.findAll({
		order: [[Sequelize.fn('lower', Sequelize.col('createdAt')), 'ASC']],
		raw: true,
		where: {
			weekTagId: thisWeekTagId,
		},
	});

	// for each image copy...
	for (const imageCopy of imageCopies) {
		// Find base image
		const image = await models.image.findOne({ where: { id: imageCopy.imageId } });

		// Find image type
		const type = await models.imageType.findOne({ where: { id: image.imageTypeId } });

		// get the absolute path of the image
		const imagePath = path.join(type.location, image.fileName + image.fileType);

		// Push to image copy array
		imageCopyArray.push([
			imagePath,
			imageCopy.id,
			imageCopy.imageId,
			imageCopy.posX,
			imageCopy.posY,
			image.fileName,
			type.name,
		]);
	}

	// return the array of image paths to use as img src ref in front-end
	return imageCopyArray;
};

// Returns the folder location path of a specific image type
const getFolderLocation = async (category) => {
	const imageType = await models.imageType.findOne({ where: { name: category } });
	return imageType.location;
};

// Called when folder path is changed for specific image type
// Set customization flag in model
const updateFolderLocation = async (category, typePath) => {
	const imageType = await models.imageType.findOne({ where: { name: category } });
	if (fs.existsSync(typePath))
		imageType.update({ location: typePath, isCustomized: true });
};

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

// Initialize week tags
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

const getSettings = async () => {
	return models.settings.findOrCreate({ where: {} }).then(res => {
		return res.holdValue;
	});
};

const setSettings = async (holdValue) => {
	return models.settings.update({ holdValue }, { where: {} });
};

module.exports = {
	writeImages,
	writeAllImages,
	readImages,
	updateCalendar,
	setImageCopy,
	deleteImageCopy,
	getImageCopies,
	getFolderLocation,
	updateFolderLocation,
	initializeImageTypes,
	initializeWeekTags,
	getSettings,
	setSettings,
};
