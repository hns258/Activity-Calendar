// Our current sequelize module uses NODE_ENV, so we need to set it before loading it.
process.env.NODE_ENV = 'test';

const { assert } = require('chai');
const node_assert = require('node:assert');
const { createFsFromVolume, Volume } = require('memfs');

const { sequelize } = require('../src/sequelize');
const { ActivityCalendar } = require('../src/activity-calendar');
const seed = require('../src/seed');

async function getPopularCatgory() {
    return sequelize.models.category.findOne({
        where: {
            name: 'Popular'
        }
    })
}

// We create a new ActivityCalendar with fresh in-memory fs for each test.
const vol = new Volume();

let activityCalendar = null;

beforeEach(async function () {
    vol.fromJSON({
        '/images/1.jpg': '123',
        '/images/2.jpg': '456',
    });

    await sequelize.sync();
    await seed();

    activityCalendar = new ActivityCalendar(createFsFromVolume(vol));
});

afterEach(async function () {
    // Remove all changes made to our fake fs during the test.
    vol.reset();

    await sequelize.drop();
});

describe('getSymbols()', async function () {
    it('returns nothing if there are no symbols', async function () {
        const symbols = await activityCalendar.getSymbols();
        assert.strictEqual(symbols.length, 0);
    });

    it('returns created symbols', async function () {
        const category = await getPopularCatgory();
        const symbol = await activityCalendar.createSymbol('/images/1.jpg', 'foo', 'Person', '10px', '5px', 0, category.id);

        const symbols = await activityCalendar.getSymbols();
        assert.strictEqual(symbols.length, 1);
        assert.deepInclude(symbols[0].dataValues, symbol.dataValues);
    });
});

describe('createSymbol()', async function () {
    it('create is successful', async function () {
        const category = await getPopularCatgory();
        const symbol = await activityCalendar.createSymbol('/images/1.jpg', 'foo', 'Person', '10px', '5px', 0, category.id);

        // Verify the image path was actually copied rather than using the same image path.
        assert.notStrictEqual(symbol.imageFilePath, '/images/1.jpg');
        assert.strictEqual(vol.readFileSync(symbol.imageFilePath, 'utf-8'), '123');

        // Verify that the extension was kept, so that it renders properly when referenced on the frontend.
        assert.match(symbol.imageFilePath, /.jpg/);

        assert.include(symbol.dataValues, {
            name: 'foo',
            type: 'Person',
            posX: '10px',
            posY: '5px',
            zoom: 0,
            categoryId: category.id
        });
    });

    it('create with invalid image path', async function () {
        const category = await getPopularCatgory();
        node_assert.rejects(async () => {
            return activityCalendar.createSymbol('/images/invalid.jpg', 'foo', 'Person', '10px', '5px', 0, category.id);
        }, {
            name: 'Error',
            type: 'ENOENT: no such file or directory, open \'/images/invalid.jpg\''
        });
    });
});
