
module.exports = (sequelize) => {
    const { image, imageCopy, imageType, weekTag } = sequelize.models;

    image.hasMany(imageCopy);
    imageCopy.belongsTo(image);

    imageType.hasMany(image);
    image.belongsTo(imageType);

    weekTag.hasMany(imageCopy);
    imageCopy.belongsTo(weekTag);
};
