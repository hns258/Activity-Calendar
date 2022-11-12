const DataTypes = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("imageCopy", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    posX: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    posY: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  });
};
