const sequelize = require('sequelize');
const fs = require('fs');
const { readdir } = require('fs/promises');
const isDev = require('electron-is-dev');
const path = require('path');
const app = require('electron').app;
const { Op } = require('sequelize');

// Import Models
const Image = require('../models/Image');
const ImageCopy = require('../models/ImageCopy');
const ImageType = require('../models/ImageType');
const Settings = require('../models/Settings');
const WeekTag = require('../models/WeekTag');

// Called when folder location changes
// Adds new images to the database
const writeImages = async (category) => {
	// find image type by passed in image type name (e.g. 'activities')
	const type = await ImageType.findOne({
		raw: true,
		where: { Name: category },
	});

	// Read the files inside current image type directory
	try {
		const files = await readdir(type.Location);
		for (const file of files) {
			const name = file.substring(0, file.length - 4);
			const extension = file.substring(file.length - 4);

			// check if the image already exists
			const image = await Image.findOne({
				where: { FileName: name, ImageTypeID: type.ID },
			});

			// if the image doesn't exist, add it to the database
			if (!image) {
				await Image.create({
					FileName: name,
					FileType: extension,
					ImageTypeID: type.ID,
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
	const types = await ImageType.findAll();
	for (const type of types) await writeImages(type.Name);
};

// Called when folder location changes
// Get all images of certain type in alphabetical order
// If the file doesn't exist anymore, delete the image and its copies
// Returns an array of image paths
const readImages = async (category) => {
	// declare image array
	const imageArray = [];

	// find image type by passed in image type name (e.g. 'activities')
	const type = await ImageType.findOne({
		where: { Name: category },
	});

	// get all images matching image type in alphabetical order
	const images = await Image.findAll({
		order: [[sequelize.fn('lower', sequelize.col('FileName')), 'ASC']],
		raw: true,
		where: {
			ImageTypeID: type.ID,
		},
	});

	// for each image...
	for (const image of images) {
		// get the absolute path of the image
		const imagePath = path.join(type.Location, image.FileName + image.FileType);
		// if image still exists, push the path onto the image path array
		if (fs.existsSync(imagePath))
			imageArray.push([imagePath, image.ID, image.FileName]);
		// if image doesn't exist, destroy its copies and the image
		else {
			await ImageCopy.destroy({
				where: { ImageID: image.ID },
			});
			await Image.destroy({ where: { ID: image.ID } });
		}
	}

	// return the array of image paths to use as img src ref in front-end
	return imageArray;
};

const setEndDates = async (weekStart) => {
	// find all weektags
	const weektags = await WeekTag.findAll();
	// for each week tag, if end date is null, set to 7 and 14 days out respectively
	for (const weektag of weektags) {
		await weektag.update({
			EndDate: new Date(weekStart.setDate(weekStart.getDate() + 7)),
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
	const currentWeekTag = await WeekTag.findOne({ where: { ID: 1 } });
	const nextWeekTag = await WeekTag.findOne({ where: { ID: 2 } });

	// if an end date is null, set new end dates
	if (currentWeekTag.EndDate === null) {
		setEndDates(weekStart);
	} else {
		// if current date is past next week end date
		if (nextWeekTag.EndDate < currentDate) {
			// destroy all image copies
			await ImageCopy.destroy({ truncate: true });
			// set new end dates
			setEndDates(weekStart);
			return;
		} else if (currentWeekTag.EndDate < currentDate) {
			// destroy current week image copies
			await ImageCopy.destroy({ where: { WeekTagID: 1 } });
			// update next week image copies to this week
			await ImageCopy.update(
				{ WeekTagID: 1 },
				{
					where: {
						WeekTagID: 2,
					},
				}
			);
			// Set current week tag's end date to next week's
			await currentWeekTag.update({ EndDate: new Date(nextWeekTag.EndDate) });
			// Update next week tag's end date
			const currentWeekEndDate = currentWeekTag.EndDate;
			await nextWeekTag.update({
				EndDate: new Date(
					currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 7)
				),
			});
		}
	}
}; // end of function

// Called when...
//    Image is dragged onto calendar
//    Image copy is moved
// Takes in image or imagecopy id, PosX, PosY, weekTagID
const setImageCopy = async (
	copyID,
	baseID,
	thisPosX,
	thisPosY,
	thisWeekTagID
) => {
	// Try to find an already existing image copy with passed in ID
	const imageCopy = await ImageCopy.findOne({ where: { ID: copyID } });

	// If one exists, update posX and posY
	if (imageCopy) {
		imageCopy.PosX = thisPosX;
		imageCopy.PosY = thisPosY;
		await imageCopy.save();
	} else {
		// Find image with passed in ID
		const image = await Image.findOne({ where: { ID: baseID } });
		// Original image stored in activities (if popular)
		let baseImage;

		// If the image is of type "popular"
		if (image.ImageTypeID === 3) {
			// check if a base image exists in "activities"
			baseImage = await Image.findOne({
				where: {
					FileName: image.FileName,
					ImageTypeID: {
						[Op.not]: 3,
					},
				},
			});
		}

		// if a base image exists, set to that id, otherwise set to popular id
		const imageID = baseImage ? baseImage.ID : image.ID;

		// Create image copy with set variables
		await ImageCopy.create({
			ID: copyID,
			PosX: thisPosX,
			PosY: thisPosY,
			ImageID: imageID,
			WeekTagID: thisWeekTagID,
		});
	}
};

// Called when an image is dragged and dropped onto the delete tab
// Deletes an image copy from the database
// Takes in image copy name
const deleteImageCopy = async (id) => {
	// Delete Image copy found by passed in array
	await ImageCopy.destroy({ where: { ID: id } });
};

// Called when app loads
// Get all image copies sorted by created date
const getImageCopies = async (thisWeekTagID) => {
	// declare image copy array
	const imageCopyArray = [];

	// get all images matching image type in order of created date
	const imageCopies = await ImageCopy.findAll({
		order: [[sequelize.fn('lower', sequelize.col('createdAt')), 'ASC']],
		raw: true,
		where: {
			WeekTagID: thisWeekTagID,
		},
	});

	// for each image copy...
	for (const imageCopy of imageCopies) {
		// Find base image
		const image = await Image.findOne({ where: { ID: imageCopy.ImageID } });

		// Find image type
		const type = await ImageType.findOne({ where: { ID: image.ImageTypeID } });

		// get the absolute path of the image
		const imagePath = type.Location + '\\' + image.FileName + image.FileType;

		// Push to image copy array
		imageCopyArray.push([
			imagePath,
			imageCopy.ID,
			imageCopy.ImageID,
			imageCopy.PosX,
			imageCopy.PosY,
			image.FileName,
			type.Name,
		]);
	}

	// return the array of image paths to use as img src ref in front-end
	return imageCopyArray;
};

// Returns the folder location path of a specific image type
const getFolderLocation = async (category) => {
	const imageType = await ImageType.findOne({ where: { Name: category } });
	return imageType.Location;
};

// Called when folder path is changed for specific image type
// Set customization flag in model
const updateFolderLocation = async (category, typePath) => {
	const imageType = await ImageType.findOne({ where: { Name: category } });
	if (fs.existsSync(typePath))
		imageType.update({ Location: typePath, IsCustomized: true });
};

// Initialize image types if they don't exist
const initializeImageTypes = async () => {
	// See if any image types exist
	const imageTypesInitialized = await ImageType.findOne();

	let basePath;
	if (isDev) {
		basePath = path.join(app.getAppPath(), 'public', 'base_images');
	} else {
		basePath = path.join(
			app.getAppPath(),
			'..',
			'..',
			'resources',
			'app.asar.unpacked',
			'public',
			'base_images'
		);
	}

	// if no image types exist, initialize them in database
	if (!imageTypesInitialized) {
		await ImageType.bulkCreate([
			{
				Name: 'people',
				Location: path.join(basePath, 'people'),
			},
			{
				Name: 'transportation',
				Location: path.join(basePath, 'transportation'),
			},
			{
				Name: 'popular',
				Location: path.join(basePath, 'popular'),
			},
			{
				Name: 'cafe-restaurants',
				Location: path.join(basePath, 'cafe-restaurants'),
			},
			{
				Name: 'parks-greenspace',
				Location: path.join(basePath, 'parks-greenspace'),
			},
			{
				Name: 'arts-education',
				Location: path.join(basePath, 'arts-education'),
			},
			{
				Name: 'volunteering-community',
				Location: path.join(basePath, 'volunteering-community'),
			},
			{
				Name: 'entertainment',
				Location: path.join(basePath, 'entertainment'),
			},
			{
				Name: 'activities-sports',
				Location: path.join(basePath, 'activities-sports'),
			},
			{
				Name: 'holiday-travel',
				Location: path.join(basePath, 'holiday-travel'),
			},
			{
				Name: 'places',
				Location: path.join(basePath, 'places'),
			},
			{
				Name: 'other',
				Location: path.join(basePath, 'other'),
			},
		]);
	}

	// find all image types that don't have customized location
	const uncustomizedTypes = await ImageType.findAll({
		where: { IsCustomized: false },
	});

	// update with built-in image location in case executable was moved
	for (const type of uncustomizedTypes)
		await type.update({
			Location: path.join(basePath, type.Name),
		});

	// Fix image types with broken folder paths
	const imageTypes = await ImageType.findAll();
	for (const type of imageTypes) {
		if (!fs.existsSync(type.Location))
			await type.update({
				Location: path.join(basePath, type.Name),
				IsCustomized: false,
			});
	}
};

// Initialize week tags
const initializeWeekTags = async () => {
	// check if any week tags exist
	const weekTagsInitialized = await WeekTag.findOne();

	// if not, initialize them
	if (!weekTagsInitialized) {
		await WeekTag.bulkCreate([
			{ Description: 'This Week' },
			{ Description: 'Next Week' },
		]);
	}
};

const getSettings = async () => {
	if (!(await Settings.findOne())) {
		return Settings.create();
	}

	const settings = await Settings.findOne();
	return settings.HoldValue;
};

const setSettings = async (newHoldValue) => {
	const settings = await Settings.findOne();
	return settings.update({ HoldValue: newHoldValue });
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
