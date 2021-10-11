const { app, BrowserWindow } = require('electron');

/* test helper functions for database functionality */
// const { 
//     initializeImageTypes,
//     initializeWeekTags,
//     testImage,
//     testImageCopy,
// } = require('./src/helpers/_testDB');

// Import database
const db = require('./src/config/db');

// Connect to database
db.authenticate()
    .then(async () => { console.log('Database connected...') })
    .catch(err => console.log('DB Error: ' + err.message));

function createWindow() {
    const win = new BrowserWindow({
        width: 600,
        height: 300
    });
    win.loadFile('./public/index.html');
};

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});