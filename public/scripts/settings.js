/*
 * Activity Calendar App
 * 2021-09-12
 * PM: Jack Everard
 * Developers: Vaaranan Yogalingam, Kyle Flores, Azhya Knox
 *
 */

/*****************************************************************/
/* IPC FUNCTIONS */
const ipcSettingsRenderer = require('electron').ipcRenderer;

// Call to get folder path for specified category
// returns folder path as a string
async function getFolderLocation(category){
  return ipcSettingsRenderer
    .invoke('get-folder', category)
    .then((folderPath) => {
      return folderPath;
    });
};

// Call to update folder path in database
// returns true if folder path update was successful
async function changeFolderLocation(category, path){
  return ipcSettingsRenderer
    .invoke('change-folder', category, path)
    .then((isUpdated) => {
      return isUpdated;
    });
};

/*****************************************************************/

function selectPeopleFolder(e, typeString) {
  var theFiles = e.target.files;
  var relativePath = theFiles[0].webkitRelativePath;
  var pathShower = document.querySelector('.people-folder-path');
  var folder = relativePath.split('/');
  var folderPath = `C:/documents/activity calender/images/${folder[0]}`;
  pathShower.innerHTML = folderPath;
  //now saving folderPath to db
  changeFolderLocation(typeString, folderPath);
}

function selectTransportFolder(e, typeString) {
  var theFiles = e.target.files;
  var relativePath = theFiles[0].webkitRelativePath;
  var pathShower = document.querySelector('.transport-folder-path');
  var folder = relativePath.split('/');
  var folderPath = `C:/documents/activity calender/images/${folder[0]}`;
  pathShower.innerHTML = folderPath;
  //now saving folderPath to app-settings.json
  changeFolderLocation(typeString, folderPath);
}

function selectPopularFolder(e, typeString) {
  var theFiles = e.target.files;
  var relativePath = theFiles[0].webkitRelativePath;
  var pathShower = document.querySelector('.popular-folder-path');
  var folder = relativePath.split('/');
  var folderPath = `C:/documents/activity calender/images/${folder[0]}`;
  pathShower.innerHTML = folderPath;
  //now saving folderPath to app-settings.json
  changeFolderLocation(typeString, folderPath);
}

function selectActivityFolder(e, typeString) {
  var theFiles = e.target.files;
  var relativePath = theFiles[0].webkitRelativePath;
  var pathShower = document.querySelector('.activity-folder-path');
  var folder = relativePath.split('/');
  var folderPath = `C:/documents/activity calender/images/${folder[0]}`;
  pathShower.innerHTML = folderPath;
  //now saving folderPath to app-settings.json
  changeFolderLocation(typeString, folderPath);
}

//return to index.html page
function returnToMain() {
  window.history.back();
}

function initializeSettings() {
  var myLocation = window.location.href;
  var url = myLocation.split('/');
  var page = url[url.length - 1];
  if (page === 'settings.html') {
    console.log("i'm in the settings page");
    var locationDisplayArr = document.querySelectorAll('.paths');
    //get folder paths from db
    getFolderLocation('people').then((value) => {
      //now load the data into the spans
      locationDisplayArr[0].innerHTML = value;
    });

    getFolderLocation('transportation').then((value) => {
      //now load the data into the spans
      locationDisplayArr[1].innerHTML = value;
    });

    getFolderLocation('popular').then((value) => {
      //now load the data into the spans
      locationDisplayArr[2].innerHTML = value;
    });

    getFolderLocation('activities').then((value) => {
      //now load the data into the spans
      locationDisplayArr[3].innerHTML = value;
    });
  } else {
    console.log('not the settings page');
  }
}

initializeSettings();
