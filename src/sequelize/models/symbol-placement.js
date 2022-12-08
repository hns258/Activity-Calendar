const DataTypes = require("sequelize");

module.exports = (sequelize) => {
  const SymbolPlacement = sequelize.define("symbolPlacement", {
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
      allowNull: true,
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

  SymbolPlacement.associate = (sequelize) => {
    const { symbol } = sequelize.models;

    SymbolPlacement.belongsTo(symbol, {
      foreignKey: { allowNull: false },
      onDelete: "CASCADE",
    });

    // TODO add constraint to ensure:
    // 1) weekTemplateId is "null", if date != Date(0)
    // 2) date == Date(0), if weekTemplateId is not "null"
  };

  return SymbolPlacement;
};
