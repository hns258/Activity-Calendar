const DataTypes = require('sequelize');
const db = require('../config/db');

module.exports = (db, DataTypes) => {
  const Image = db.define('image', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(150),
    },
    fileType: {
      type: DataTypes.STRING(50),
    }
  });

  // Associations
  Image.associate = models => {
    Image.belongsTo(models.ImageType, {
      foreignKey: 'imageTypeId',
    });
  };

  return Image;
};