const sequelize = require('sequelize');
const fs = require('fs');
const { readdir } = require('fs/promises');

// Import Models
const Image = require('../models/Image');
const ImageCopy = require('../models/ImageCopy');
const ImageType = require('../models/ImageType');
const WeekTag = require('../models/WeekTag');

// Called when folder location changes
// Adds new images to the database
const writeImages = async (category) => {
  // find image type by passed in image type name (e.g. 'popular')
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
      const imageExists = await Image.findOne({ where: { FileName: name } });
      // if not add the image to the database
      if (!imageExists) {
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

// Called when app loads
// Adds new images to database from each image type
const writeAllImages = async () => {
  const types = await ImageType.findAll();
  for (const type of types) await writeImages(type.Name);
};

// Called when folder location changes
// Get all images of certain type in alphabetical order
// If the file doesn't exist anymore, delete the image and its copies
// Returns an array of image paths
const getImages = async (category) => {
  // declare image path array
  const imageArray = [];

  // find image type by passed in image type name (e.g. 'popular')
  const type = await ImageType.findOne({
    where: { Name: category },
  });

  // get all images matching image type in alphabetical order
  const images = await Image.findAll({
    order: [
      [
        sequelize.fn('lower', sequelize.col('FileName')),
        'ASC',
      ],
    ],
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
    if (fs.existsSync(imagePath)) imageArray.push(imagePath);
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

// Called when app loads
// Get all images in alphabetical order
// Deletes images that no longer exists from the database
// Returns an array of image paths
const getAllImages = async (category) => {
  // declare image path array
  const imageArray = [];

  // get all images in alphabetical order
  const images = await Image.findAll({
    order: [
      [
        sequelize.fn('lower', sequelize.col('FileName')),
        'ASC',
      ],
    ],
    raw: true,
  });

  // for each image...
  for (const image of images) {
    // get image type path for current image
    const type = await ImageType.findOne({ where: { ID: image.ImageTypeID } });
    // get the absolute path of the image
    const imagePath = type.Location + '\\' + image.FileName + image.FileType;
    // if image still exists, push the path onto the image path array
    if (fs.existsSync(imagePath)) imageArray.push(imagePath);
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

// Called when app loads (should run before getImageCopies())
//    1. Checks for week passing
//    2. Deletes all image copies with 'This Week' tag
//    3. Changes image copies with 'Next Week' tag to 'This Week' tag
const updateCalendar = () => { }

// Called when an image is dragged and dropped onto the screen
// Saves an image copy in the database
const setImageCopy = () => { }

// Called when app loads
// Get all image copies sorted by created date
const getImageCopies = () => { }

// Called when folder path is changed for specific image type
// Pass in image type?
const updateFolderLocation = () => { }

module.exports = {
  writeImages,
  writeAllImages,
  getImages,
  getAllImages,
  updateCalendar,
  setImageCopy,
  getImageCopies,
  updateFolderLocation,
};