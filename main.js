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

function createWindow() {
  const win = new BrowserWindow({
    autoHideMenuBar: true,
    width: 2000,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile('./public/index.html');

  //win.webContents.openDevTools();
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

/* IPC */
// request to load images
ipcMain.handle('load-images', async (event, category) => {
  return await readImages(category);
});

/* NEEDS updateFolderLocaton() added */
// folder location changes
ipcMain.handle('change-folder', async (event, category) => {
  await writeImages(category);
  return await readImages(category);
});

// create image copy
ipcMain.handle(
  'create-image-copy',
  async (event, id, posX, posY, weekTagID) => {
    await setImageCopy(id, posX, posY, weekTagID);
  }
);

// move an image copy
ipcMain.handle('move-image-copy', async (event, id, posX, posY, weekTagID) => {
  await setImageCopy(id, posX, posY, weekTagID);
});

// delete an image copy
ipcMain.handle('delete-image-copy', async (event, id) => {
  await deleteImageCopy(id);
});

// delete an image copy
ipcMain.handle('load-image-copies', async (event, weekTagID) => {
  return await getImageCopies(weekTagID);
});
