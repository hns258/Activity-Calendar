const DataTypes = require('sequelize');
const db = require('../config/db');

const ImageCopy = require('./ImageCopy');

const WeekTag = db.define('weekTag', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  Description: {
    type: DataTypes.ENUM('This Week', 'Next Week'),
    allowNull: false,
  },
  EndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
});

// Associations
WeekTag.hasMany(ImageCopy);
ImageCopy.belongsTo(WeekTag, {
  foreignKey: 'WeekTagID',
  allowNull: false,
});

WeekTag.sync();

module.exports = WeekTag;
