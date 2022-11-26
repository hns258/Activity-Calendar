const crypto = require("crypto");
const path = require("path");
const Sequelize = require("sequelize");

const { sequelize, databaseDir } = require("./sequelize");
const { models } = sequelize;

const serializeSymbolModel = (symbol) => {
  const serialized = Object.assign(symbol.dataValues, {
    imageFilePath: symbol.imageFilePath,
  });
  if (serialized.category) {
    serialized.category = serialized.category.dataValues;
  }
  return serialized;
};

const serializeSymbolPlacement = (symbolPlacement) => {
  return symbolPlacement.dataValues;
};

const serializeWeekTemplate = (weekTemplate) => {
  return weekTemplate.dataValues;
};

class ActivityCalendar {
  static _USER_SETTINGS_ID = 1;

  constructor(fs = require("fs"), verbose = false) {
    this.fs = fs;
    this.verbose = verbose;
    this.symbolImagesDir = path.join(databaseDir, "symbol-images");
    this._log(
      `Creating symbol images dir if it doesn't exist: ${this.symbolImagesDir}`
    );
    this.fs.mkdirSync(this.symbolImagesDir, { recursive: true });
  }

  async getSettings() {
    return models.settings
      .findOrCreate({ where: { id: ActivityCalendar._USER_SETTINGS_ID } })
      .then(([res]) => {
        return res.holdValue;
      });
  }

  async setSettings(holdValue) {
    return models.settings.upsert({
      id: ActivityCalendar._USER_SETTINGS_ID,
      holdValue,
    });
  }

  async getSymbols() {
    const symbols = await models.symbol.findAll({
      order: [[Sequelize.fn("lower", Sequelize.col("symbol.name")), "ASC"]],
      include: models.category,
    });

    // We only want to expose the data values.
    return symbols.map(serializeSymbolModel);
  }

  // `categoryId` is only valid for Activities.
  async createSymbol(imagePath, name, type, posX, posY, zoom, categoryId) {
    const ext = path.parse(imagePath).ext;

    // The output file name will is a random 50 character string (including the ext).
    const destFileName =
      crypto.randomBytes(50 - ext.length).toString("hex") + ext;
    const destFilePath = path.join(this.symbolImagesDir, destFileName);

    // By using COPYFILE_EXCL, the copy will fail in the incredibly rare collision case.
    await this.fs.promises.copyFile(
      imagePath,
      destFilePath,
      this.fs.constants.COPYFILE_EXCL
    );

    const symbol = await models.symbol.create({
      name,
      imageFileName: destFileName,
      type,
      posX,
      posY,
      zoom,
      categoryId,
    });

    return serializeSymbolModel(symbol);
  }

  async getSymbolPlacements(dateStart, dateEnd) {
    const placements = await models.symbolPlacement.findAll({
      where: {
        date: {
          [Sequelize.Op.gte]: dateStart,
          [Sequelize.Op.lte]: dateEnd,
        },
      },
      order: [["date", "ASC"]],
    });
    return placements.map(serializeSymbolPlacement);
  }

  async getSymbolPlacementsForWeekTemplate(weekTemplateId) {
    const placements = await models.symbolPlacement.findAll({
      where: { weekTemplateId },
    });
    return placements.map(serializeSymbolPlacement);
  }

  async createSymbolPlacement(
    symbolId,
    date,
    posX,
    posY,
    weekTemplateId = null // TODO is this is ok or do we want to use smth like -1?
  ) {
    return serializeSymbolPlacement(
      await models.symbolPlacement.create({
        symbolId,
        date,
        posX,
        posY,
        weekTemplateId,
      })
    );
  }

  async createWeekTemplate(name, description = "") {
    return serializeWeekTemplate(
      await models.weekTemplate.create({ name, description })
    );
  }

  async updateSymbolPlacement(id, date, posX, posY, weekTemplateId = null) {
    const [numRows, rows] = await models.symbolPlacement.update(
      { date, posX, posY, weekTemplateId },
      { where: { id } }
    );
    if (numRows === 0) {
      throw Error(
        `Unable to find existing to update symbol placement with id ${id}.`
      );
    }
  }

  async deleteSymbolPlacement(id) {
    const numDestroyed = await models.symbolPlacement.destroy({
      where: { id },
    });
    if (numDestroyed === 0) {
      throw Error(
        `Unable to find existing to delete symbol placement with id ${id}.`
      );
    }
  }

  // TODO verify this is ok, similar to .net SqlDateTime.MinValue and placed here vs top
  static MIN_DATE = new Date(0);

  async addSymbolToWeekTemplate(symbolId, posX, posY, weekTemplateId) {
    await this.createSymbolPlacement(
      symbolId,
      ActivityCalendar.MIN_DATE, // TODO check this vs null (column is non-nullable now)
      posX,
      posY,
      weekTemplateId
    );
  }

  // TODO add update (positions have changed) and delete

  _log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }
}

module.exports = {
  ActivityCalendar,
};
