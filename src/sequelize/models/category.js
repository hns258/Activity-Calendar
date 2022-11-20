const DataTypes = require("sequelize");

module.exports = (sequelize) => {
  const Category = sequelize.define("category", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      unique: true,
      allowNull: false,
    },
  });

  Category.associate = (sequelize) => {
    const { symbol } = sequelize.models;

    Category.hasMany(symbol);
  };

  return Category;
};
