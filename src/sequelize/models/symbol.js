const DataTypes = require("sequelize");
const path = require("path");

module.exports = (sequelize, databaseDir) => {
  sequelize.define("symbol", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(24),
      unique: true,
      allowNull: false,
    },
    imageFileName: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("People", "Transport", "Activities"),
      allowNull: false,
      validate: {
        isIn: {
          args: [["People", "Transport", "Activities"]],
          msg: "type must be one of the enum values.",
        },
        // Only Activities can and must have categories.
        customValidator(value) {
          if (value === "Activities") {
            if (this.categoryId === undefined) {
              throw new Error("Activities must have a category.");
            }
          } else if (this.categoryId !== undefined) {
            throw new Error("Only Activities can have a category.");
          }
        },
      },
    },
    posX: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    posY: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    zoom: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imageFilePath: {
      type: DataTypes.VIRTUAL,
      get() {
        return path.join(databaseDir, "symbol-images", this.imageFileName);
      },
    },
  });
};
