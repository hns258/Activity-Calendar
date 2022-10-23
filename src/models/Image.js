const DataTypes = require('sequelize');
const db = require('../config/db');

const ImageCopy = require('./ImageCopy');

const Image = db.define('image', {
  ID: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  FileName: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  FileType: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  ImageTypeID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Associations
Image.hasMany(ImageCopy);
ImageCopy.belongsTo(Image, {
  foreignKey: 'ImageID',
  allowNull: false,
});

Image.sync();

module.exports = Image;
