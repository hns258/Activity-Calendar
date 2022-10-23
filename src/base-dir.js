const path = require('path');
const isDev = require('electron-is-dev');
const app = require('electron').app;

// Returns the env-dependent base directory to be used by any fs-based calls.
function getBaseDir() {
    const envDependentPath = isDev ?
        '' : path.join('..', '..', 'resources', 'app.asar.unpacked');
    return path.join(app.getAppPath(), envDependentPath);
}

module.exports = getBaseDir;
