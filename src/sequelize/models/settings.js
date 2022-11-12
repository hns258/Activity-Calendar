const DataTypes = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define("settings", {
    holdValue: {
      type: DataTypes.INTEGER,
      defaultValue: 300,
    },
  });
};
