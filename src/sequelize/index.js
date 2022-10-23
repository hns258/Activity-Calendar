const { Sequelize } = require('sequelize');
const path = require('path');
const associations = require('./associations');
const getBaseDir = require('../base-dir.js');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(getBaseDir(), 'src', 'database', 'database.sqlite3'),
  logQueryParameters: true,
});

const modelDefiners = [
  require('./models/image'),
  require('./models/image-copy'),
  require('./models/image-type'),
  require('./models/settings'),
  require('./models/week-tag'),
];

for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

associations(sequelize);

// We export the sequelize connection instance to be used around our app.
module.exports = sequelize;
