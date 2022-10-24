const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const { models } = require('./sequelize');

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


const getSettings = async () => {
	return models.settings.findOrCreate({ where: {} }).then(([res]) => {
		return res.holdValue;
	});
};

const setSettings = async (holdValue) => {
	return models.settings.update({ holdValue }, { where: {} });
};

module.exports = {
	readImages,
	setImageCopy,
	deleteImageCopy,
	getImageCopies,
	getFolderLocation,
	updateFolderLocation,
	getSettings,
	setSettings,
};
