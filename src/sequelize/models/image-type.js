const DataTypes = require('sequelize');

module.exports = (sequelize) => {
	sequelize.define('imageType', {
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
};
