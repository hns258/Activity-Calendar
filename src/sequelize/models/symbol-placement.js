const DataTypes = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define("symbolPlacement", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // The UI currently places symbols on the week granularity, though this will
    // change in the future.
    date: {
      type: DataTypes.DATE,
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
