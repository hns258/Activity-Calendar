const path = require("path");

const { models } = require("../sequelize").sequelize;

const initializeSymbols = async (activityCalendar) => {
  // For now, we don't expect anything to run concurrent with this so we will
  // exclude any symbols that are already saved. In the future, we may consider
  // having seeding be an explicit setup command used to reinitialize the
  // database.
  const existingSymbols = new Set(
    (await activityCalendar.getSymbols()).map((symbol) => symbol.name)
  );

  const fs = activityCalendar.fs;
  const imagesDir = path.join(__dirname, "images");

  const initializeWithLeafDir = async (dir, type, categoryId) => {
    const files = await fs.promises.readdir(dir);
    await Promise.all(
      files.map((file) => {
        const name = path.parse(file).name;
        if (existingSymbols.has(name)) {
          return;
        }

        return activityCalendar.createSymbol(
          path.join(dir, file),
          name,
          type,
          "0px",
          "0px",
          0,
          categoryId
        );
      })
    );
  };

  const initializeActivities = async () => {
    const activitiesDir = path.join(imagesDir, "activities");
    const categoryNames = await fs.promises.readdir(activitiesDir);

    const categories = await models.category.bulkCreate(
      categoryNames.map((name) => {
        return { name };
      }),
      {
        ignoreDuplicates: true,
      }
    );

    await Promise.all(
      categories.map((category) => {
        return initializeWithLeafDir(
          path.join(activitiesDir, category.name),
          "activities",
          category.id
        );
      })
    );
  };

  await Promise.all([
    initializeActivities(),
    initializeWithLeafDir(
      path.join(imagesDir, "transportation"),
      "transportation"
    ),
  ]);
};

module.exports = initializeSymbols;
