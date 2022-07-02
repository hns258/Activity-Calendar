const DataTypes = require('sequelize');
const db = require('../config/db');

const Image = require('./Image');

const ImageType = db.define('imageType', {
	ID: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false,
	},
	Name: {
		type: DataTypes.STRING(150),
		allowNull: false,
	},
	Location: {
		type: DataTypes.STRING(500),
	},
	IsCustomized: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
});

// Associations
ImageType.hasMany(Image);
Image.belongsTo(ImageType, {
	foreignKey: 'ImageTypeID',
	allowNull: false,
});

ImageType.sync();

module.exports = ImageType;
