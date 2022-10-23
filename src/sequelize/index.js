const { Sequelize } = require('sequelize');
const isDev = require('electron-is-dev');
const path = require('path');
const app = require('electron').app;
const associations = require('./associations');

let dbFile = isDev ?
  path.join(app.getAppPath(), 'src', 'database', 'database.sqlite3') :
  path.join(
    app.getAppPath(),
    '..',
    '..',
    'resources',
    'app.asar.unpacked',
    'src',
    'database',
    'database.sqlite3'
  );

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbFile,
  logQueryParameters: true,
});

const modelDefiners = [
  require('./models/image'),
  require('./models/imageCopy'),
  require('./models/imageType'),
  require('./models/settings'),
  require('./models/weekTag'),
];

for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

associations(sequelize);

// We export the sequelize connection instance to be used around our app.
module.exports = sequelize;
