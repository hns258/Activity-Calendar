const DataTypes = require('sequelize');
const db = require('../config/db');

const ImageCopy = db.define('imageCopy', {
  ID: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  },
  PosX: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  PosY: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  ImageID: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  WeekTagID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

ImageCopy.sync();

module.exports = ImageCopy;
