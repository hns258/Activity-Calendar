const DataTypes = require('sequelize');

module.exports = (sequelize) => {
	sequelize.define('settings', {
		HoldValue: {
			type: DataTypes.INTEGER,
			defaultValue: 300,
		},
	});
};
