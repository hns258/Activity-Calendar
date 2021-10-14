const { readdir } = require('fs/promises');
const path = require('path');

// Import Models
const Image = require('../models/Image');
const ImageCopy = require('../models/ImageCopy');
const ImageType = require('../models/ImageType');
const WeekTag = require('../models/WeekTag');

// Called when app loads or folder location changes
// Adds new images to the database
const writeImages = async () => {
  // Get all image types
  const types = await ImageType.findAll({ raw: true });
  for (const type of types) {
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
          await Image.create({ FileName: name, FileType: extension, ImageTypeID: type.ID });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
}

// Called when folder location changes
// Get all images of certain type in alphabetical order
const getSomeImages = (category) => { }

// Called when app loads
// Get all images in alphabetical order
// Deletes images that no longer exists from the database
const getAllImages = () => { }

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
  getSomeImages,
  getAllImages,
  updateCalendar,
  setImageCopy,
  getImageCopies,
  updateFolderLocation,
};