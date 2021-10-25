const sequelize = require('sequelize');
const fs = require('fs');
const { readdir } = require('fs/promises');
const isDev = require('electron-is-dev');
const path = require('path');
const app = require('electron').app;

// Import Models
const Image = require('../models/Image');
const ImageCopy = require('../models/ImageCopy');
const ImageType = require('../models/ImageType');
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
    const imagePath = type.Location + '\\' + image.FileName + image.FileType;
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

/* NEEDS TESTING */
// Called when app loads (should run before getImageCopies())
//    1. Checks for week passing
//    2. Deletes all image copies with 'This Week' tag
//    3. Changes image copies with 'Next Week' tag to 'This Week' tag
const updateCalendar = async () => {
  const check = new Date();
  if (check.getDay() == 0 && check.getHours() == 0) {
    const imageArray = [];

    const imagesForRemoval = await ImageCopy.findAll({
      where: { WeekTagID: 2 },
    });
    const imagesForUpdate = await ImageCopy.findAll({
      where: { WeekTagID: 1 },
    });
    //remove images with 'this week' tag
    for (const image of imagesForRemoval) {
      await ImageCopy.destroy(image);
    }
    //update images with 'next week' tag
    for (const image of imagesForUpdate) {
      await image.update({
        WeekTagID: 2,
      });
    }

    return imageArray;
  } // end of if statement
}; // end of function

// Called when...
//    Image is dragged onto calendar
//    Image copy is moved
// Takes in image or imagecopy id, PosX, PosY, weekTagID
const setImageCopy = async (id, thisPosX, thisPosY, thisWeekTagID) => {
  // Try to find an already existing image copy with passed in ID
  const imageCopy = await ImageCopy.findOne({ where: { ID: id } });

  // If one exists, update posX and posY
  if (imageCopy) {
    imageCopy.PosX = thisPosX;
    imageCopy.PosY = thisPosY;
    await imageCopy.save();
  } else {
    // Find image with passed in ID
    const image = await Image.findOne({ where: { ID: id } });
    // Original image stored in activities (if popular)
    let baseImage;

    // If the image is of type "popular"
    if (image.ImageTypeID === 3) {
      // check if a base image exists in "activities"
      baseImage = await Image.findOne({
        where: { FileName: image.FileName, ImageTypeID: 4 },
      });
    }

    // if a base image exists, set to that id, otherwise set to popular id
    const imageID = baseImage ? baseImage.ID : image.ID;

    // Create image copy with set variables
    await ImageCopy.create({
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
    imageCopyArray.push([imagePath, imageCopy.ID, image.FileName]);
  }

  // return the array of image paths to use as img src ref in front-end
  return imageCopyArray;
};

/* NEEDS IMPLEMENTATION */
// Called when folder path is changed for specific image type
// Set customization flag in model
const updateFolderLocation = () => {};

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
        Name: 'activities',
        Location: path.join(basePath, 'activities'),
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

module.exports = {
  writeImages,
  writeAllImages,
  readImages,
  updateCalendar,
  setImageCopy,
  deleteImageCopy,
  getImageCopies,
  updateFolderLocation,
  initializeImageTypes,
  initializeWeekTags,
};
