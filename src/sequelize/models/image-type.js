const DataTypes = require('sequelize');

module.exports = (sequelize) => {
	sequelize.define('imageType', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING(150),
			allowNull: false,
		},
		location: {
			type: DataTypes.STRING(500),
		},
		isCustomized: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	});
};
