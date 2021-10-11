/*
 * This file contains helper functions to TEST the database functionality 
 */

// Import Models
const Image = require('../models/Image');
const ImageCopy = require('../models/ImageCopy');
const ImageType = require('../models/ImageType');
const WeekTag = require('../models/WeekTag');


// Initialize image types if they don't exist
const initializeImageTypes = async () => {
  await ImageType.bulkCreate([
    { Name: 'people' },
    { Name: 'transport' },
    { Name: 'popular'},
    { Name: 'activity'},
  ]);
}

// Initialize week tags if they don't exist
const initializeWeekTags = async () => {
  await WeekTag.bulkCreate([
    { Description: 'This Week' },
    { Description: 'Next Week' },
  ]);
}

// test write image to database
const testImage = async () => {
  await Image.create({ FileName: 'Cycling', FileType: '.png', ImageTypeID: 2 });
};

// test write image copy to database
/* You need to have have Cycling image in database from testImage() */
const testImageCopy = async () => {
  const originalImage = await Image.findOne({ where: { FileName: 'Cycling' }});
  await ImageCopy.create({ FileName: 'Cycling', PosX: 0, PosY: 0,  ImageID: originalImage.ID, WeekTagID: 1});
};

module.exports = {
  initializeImageTypes,
  initializeWeekTags,
  testImage,
  testImageCopy,
};