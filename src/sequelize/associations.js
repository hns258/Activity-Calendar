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

  symbol.hasMany(symbolPlacement);
  symbolPlacement.belongsTo(symbol);
};
