const { app, BrowserWindow, ipcMain, dialog } = require("electron");

// Load DB helpers
const { ActivityCalendar } = require("./src/activity-calendar");

const seed = require("./src/seed");

const { sequelize } = require("./src/sequelize");

const calendar = new ActivityCalendar();

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
  win.loadFile("./public/index.html");
}

app.whenReady().then(async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  await seed(calendar);
  createWindow();
});

app.on("window-all-closed", async function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("get-hold-value", async (event) => {
  return calendar.getSettings();
});

ipcMain.handle("set-hold-value", async (event, newHoldValue) => {
  try {
    await calendar.setSettings(newHoldValue);
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle("get-symbols", async () => {
  return calendar.getSymbols();
});

ipcMain.handle(
  "create-symbol",
  async (event, imagePath, name, type, posX, posY, zoom, categoryId) => {
    return calendar.createSymbol(
      imagePath,
      name,
      type,
      posX,
      posY,
      zoom,
      categoryId
    );
  }
);

ipcMain.handle("get-symbol-placements", async (event, inCurrentWeek) => {
  return calendar.getSymbolPlacements(inCurrentWeek);
});

ipcMain.handle(
  "create-symbol-placement",
  async (event, symbolId, posX, posY, inCurrentWeek) => {
    return calendar.createSymbolPlacement(symbolId, posX, posY, inCurrentWeek);
  }
);

ipcMain.handle("update-symbol-placement", async (event, id, posX, posY) => {
  return calendar.updateSymbolPlacement(id, posX, posY);
});

ipcMain.handle("delete-symbol-placement", async (event, id) => {
  return calendar.deleteSymbolPlacement(id);
});
