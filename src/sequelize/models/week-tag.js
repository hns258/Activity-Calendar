const DataTypes = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('weekTag', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.ENUM('This Week', 'Next Week'),
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  });
  
};
