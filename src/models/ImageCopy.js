const { DataTypes, Deferrable } = require('sequelize');
const db = require('../config/db');

const ImageCopy = db.define('imageCopy', {
  ID: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
    deferrable: Deferrable.INITIALLY_DEFERRED,
    allowNull: false,
  },
  WeekTagID: {
    type: DataTypes.INTEGER,
    deferrable: Deferrable.INITIALLY_DEFERRED,
    allowNull: false,
  },
});

ImageCopy.sync();

module.exports = ImageCopy;
