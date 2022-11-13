const DataTypes = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define("symbolPlacement", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // If it's not in the current week, we assume it's in the next week.
    // In the future, we should consider making this a date field instead,
    // but this is done to maintain compatibility with existing interfaces.
    inCurrentWeek: {
      type: DataTypes.BOOLEAN,
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
