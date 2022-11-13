// Our current sequelize module uses NODE_ENV, so we need to set it before loading it.
process.env.NODE_ENV = "test";

const { assert } = require("chai");
const node_assert = require("node:assert");
const { createFsFromVolume, Volume } = require("memfs");

const { sequelize } = require("../src/sequelize");
const { ActivityCalendar } = require("../src/activity-calendar");
const seed = require("../src/seed");

// We create a new ActivityCalendar with fresh in-memory fs for each test.
const vol = new Volume();

let activityCalendar = null,
  popularCategory = null;

beforeEach(async function () {
  vol.fromJSON({ "/images/1.jpg": "123", "/images/2.jpg": "456" });

  await sequelize.sync();
  await seed();

  activityCalendar = new ActivityCalendar(createFsFromVolume(vol));

  popularCategory = await sequelize.models.category.findOne({
    where: {
      name: "Popular",
    },
  });
});

afterEach(async function () {
  // Remove all changes made to our fake fs during the test.
  vol.reset();

  await sequelize.drop();
});

describe("settings", async function () {
  it("is initialized with a default", async function () {
    const defaultHoldValue = await activityCalendar.getSettings();
    assert.strictEqual(defaultHoldValue, 300);
  });

  it("set properly updates", async function () {
    await activityCalendar.setSettings(500);

    const holdValue = await activityCalendar.getSettings();
    assert.strictEqual(holdValue, 500);
  });
});

describe("getSymbols()", async function () {
  it("returns nothing if there are no symbols", async function () {
    const symbols = await activityCalendar.getSymbols();
    assert.strictEqual(symbols.length, 0);
  });

  it("returns created symbols", async function () {
    const symbol = await activityCalendar.createSymbol(
      "/images/1.jpg",
      "foo",
      "Person",
      "10px",
      "5px",
      0,
      popularCategory.id
    );

    const symbols = await activityCalendar.getSymbols();
    assert.strictEqual(symbols.length, 1);
    assert.deepInclude(symbols[0].dataValues, symbol.dataValues);
  });
});

describe("createSymbol()", async function () {
  it("create is successful", async function () {
    const createSymbol = async (name) => {
      return activityCalendar.createSymbol(
        "/images/1.jpg",
        name,
        "Person",
        "10px",
        "5px",
        0,
        popularCategory.id
      );
    };

    const [symbol1, symbol2] = await Promise.all([
      createSymbol("activity1"),
      createSymbol("activity2"),
    ]);

    // Verify the image path was actually copied rather than using the same image path.
    assert.notStrictEqual(symbol1.imageFilePath, "/images/1.jpg");
    assert.notStrictEqual(symbol1.imageFilePath, symbol2.imageFilePath);

    const validateCommon = (symbol, expectedName) => {
      // Verify that the extension was kept, so that it renders properly when referenced on the frontend.
      assert.match(symbol.imageFilePath, /.jpg/);

      assert.strictEqual(
        vol.readFileSync(symbol.imageFilePath, "utf-8"),
        "123"
      );

      assert.include(symbol.dataValues, {
        name: expectedName,
        type: "Person",
        posX: "10px",
        posY: "5px",
        zoom: 0,
        categoryId: popularCategory.id,
      });
    };

    validateCommon(symbol1, "activity1");
    validateCommon(symbol2, "activity2");

    // Verify that the symbols didn't overwrite each other.
    const savedSymbols = await activityCalendar.getSymbols();
    assert.strictEqual(savedSymbols.length, 2);
  });

  it("create with invalid image path", async function () {
    await node_assert.rejects(
      async () => {
        return activityCalendar.createSymbol(
          "/images/invalid.jpg",
          "foo",
          "Person",
          "10px",
          "5px",
          0,
          popularCategory.id
        );
      },
      {
        name: "Error",
        message:
          "ENOENT: no such file or directory, open '/images/invalid.jpg'",
      }
    );
  });
});
