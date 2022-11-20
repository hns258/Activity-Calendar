const DataTypes = require("sequelize");

module.exports = (sequelize) => {
  const Settings = sequelize.define("settings", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    holdValue: {
      type: DataTypes.INTEGER,
      defaultValue: 300,
    },
  });

  return Settings;
};
