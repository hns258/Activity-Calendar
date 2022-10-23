const { Sequelize } = require('sequelize');
const path = require('path');
const app = require('electron').app;
const fs = require('fs');

const associations = require('./associations');

const databaseDir = app && app.isPackaged
  ? path.join(process.resourcesPath, 'database')
  : path.join(__dirname, '..', '..', 'database');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(databaseDir, 'database.sqlite3'),
  logQueryParameters: true,
});

const symbolImagesDir = path.join(databaseDir, 'symbol-images');

console.log(`Creating symbol images dir if it doesn't exist: ${symbolImagesDir}`);
fs.mkdirSync(symbolImagesDir, { recursive: true });

const modelDefiners = [
  require('./models/image'),
  require('./models/image-copy'),
  require('./models/image-type'),
  require('./models/settings'),
  require('./models/week-tag'),
  require('./models/symbol'),
  require('./models/symbol-placement'),
  require('./models/category'),
];

for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize, databaseDir);
}

associations(sequelize);

// We export the sequelize connection instance to be used around our app.
module.exports = sequelize;
