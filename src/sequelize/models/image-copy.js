const DataTypes = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('imageCopy', {
    ID: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    PosX: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    PosY: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  });
};
