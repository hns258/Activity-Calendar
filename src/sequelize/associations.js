module.exports = (sequelize) => {
  const {
    image,
    imageCopy,
    imageType,
    weekTag,
    category,
    symbol,
    symbolPlacement,
  } = sequelize.models;

  imageType.hasMany(image);
  image.belongsTo(imageType);

  image.hasMany(imageCopy);
  imageCopy.belongsTo(image);

  weekTag.hasMany(imageCopy);
  imageCopy.belongsTo(weekTag);

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
