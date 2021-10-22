const { app, BrowserWindow, ipcMain } = require('electron');

// Load DB helpers
const {
  writeImages,
  writeAllImages,
  readImages,
  updateCalendar,
  setImageCopy,
  getImageCopies,
  updateFolderLocation,
  initializeImageTypes,
  initializeWeekTags,
} = require('./src/helpers/dbFunctions');

// Import database
const db = require('./src/config/db');

// Connect to database
db.authenticate()
  .then(console.log('Database connected...'))
  .catch((err) => console.log('DB Error: ' + err.message));

/* IPC */
// request to load images
ipcMain.handle('load-images', async (event, category) => {
  return await readImages(category);
});

// folder location changes
ipcMain.handle('change-folder', async (event, category) => {
  await writeImages(category);
  return await readImages(category);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 2000,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile('./public/index.html');

  // win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await initializeWeekTags();
  await initializeImageTypes();
  await writeAllImages();
  createWindow();
});

app.on('window-all-closed', async function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});