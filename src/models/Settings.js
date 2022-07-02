const DataTypes = require('sequelize');
const db = require('../config/db');

const Settings = db.define('settings', {
	HoldValue: {
		type: DataTypes.INTEGER,
		defaultValue: 300,
	},
});

Settings.sync();

module.exports = Settings;
