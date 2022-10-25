const path = require('path');
const app = require('electron').app;

// Returns the env-dependent base directory to be used by any dynamic user data.
function getUserDataDir() {
    return app && app.isPackaged
        ? path.join(process.resourcesPath)
        : path.join(__dirname, '..');
}

module.exports = getUserDataDir;
