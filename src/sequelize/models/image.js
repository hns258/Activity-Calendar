const DataTypes = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define("image", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  });
};
