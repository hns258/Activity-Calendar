const DataTypes = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('weekTag', {
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
  
};
