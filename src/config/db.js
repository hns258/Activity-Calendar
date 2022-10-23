const Sequelize = require('sequelize');
const isDev = require('electron-is-dev');
const path = require('path');
const app = require('electron').app;

let dbFile;
if (isDev) {
  dbFile =  path.join(app.getAppPath(), 'src', 'database', 'database.sqlite3');
} else {
  dbFile = path.join(
    app.getAppPath(),
    '..',
    '..',
    'resources',
    'app.asar.unpacked',
    'src',
    'database',
    'database.sqlite3'
  );
}

module.exports = new Sequelize({
  dialect: 'sqlite',
  storage: dbFile,
  logQueryParameters: true,
});
