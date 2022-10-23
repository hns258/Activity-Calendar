const DataTypes = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('image', {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    FileName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    FileType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  });
};
