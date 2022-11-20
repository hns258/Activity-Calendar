module.exports = (sequelize) => {
  const { category, symbol, symbolPlacement } = sequelize.models;

  category.hasMany(symbol);
  symbol.belongsTo(category);

  symbol.hasMany(symbolPlacement, {
    foreignKey: { allowNull: false },
    onDelete: "CASCADE",
  });

  symbolPlacement.belongsTo(symbol, {
    foreignKey: { allowNull: false },
    onDelete: "CASCADE",
  });
};
