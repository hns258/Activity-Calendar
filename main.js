const { app, BrowserWindow } = require('electron');

const db = require('./src/config/db');

const connectDB = async () => {
    try {
        await db.authenticate();
        console.log('Database connected...');
    } catch (err) {
        console.log('DB Error: ' + err.message);
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 600,
        height: 300
    });
    win.loadFile('./public/index.html');
};

app.whenReady().then(() => {
    connectDB();
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});