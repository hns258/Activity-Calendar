/*
 * Activity Calendar App
 * 2021-09-12
 * PM: Jack Everard
 * Developers: Vaaranan Yogalingam, Kyle Flores, Azhya Knox
 *
 */

/*****************************************************************/
/* IPC FUNCTIONS */
const ipcSettingsRenderer = require("electron").ipcRenderer;

var delayValue;
var slider = document.getElementById("delayRange");
var output = document.getElementById("delayValue");

// Call to open electron dialog and select directory
// returns new folder path as a string
async function selectFolder() {
  return ipcSettingsRenderer.invoke("select-folder").then((newPath) => {
    return newPath.filePaths[0];
  });
}

// Call to get folder path for specified category
// returns folder path as a string
async function getFolderLocation(category) {
  return ipcSettingsRenderer
    .invoke("get-folder", category)
    .then((folderPath) => {
      return folderPath;
    });
}

// Call to update folder path in database
// returns true if folder path update was successful
async function changeFolderLocation(category, path) {
  return ipcSettingsRenderer
    .invoke("change-folder", category, path)
    .then((isUpdated) => {
      return isUpdated;
    });
}

async function getHoldValue() {
  return ipcSettingsRenderer.invoke("get-hold-value").then((holdValue) => {
    return holdValue;
  });
}

async function setHoldValue(newHoldValue) {
  return ipcSettingsRenderer
    .invoke("set-hold-value", newHoldValue)
    .then((isUpdated) => {
      return isUpdated;
    });
}

/*****************************************************************/

function selectSettingsFolder(event) {
  var type = event.currentTarget.id.split("-")[0];
  var cat = type;
  if (type === "activities") {
    cat = document.querySelector("#category-dropdown").value;
  }
  console.log(type);
  selectFolder().then((newPath) => {
    var pathShower = document.querySelector(`.${type}-folder-path`);
    changeFolderLocation(cat, newPath).then((isUpdated) => {
      if (isUpdated) {
        pathShower.innerHTML = newPath;
        // setTimeout(()=>{
        //   location.reload();
        // }, 500);
      }
    });
  });
}

//return to index.html page
function returnToMain() {
  window.history.back();
}

function initializeSettings() {
  getHoldValue().then((value) => {
    delayValue = value;
    slider.value = value;
    output.innerHTML = value + "ms";
  });
  var myLocation = window.location.href;
  var url = myLocation.split("/");
  var page = url[url.length - 1];
  if (page === "settings.html") {
    console.log("i'm in the settings page");
    var locationDisplayArr = document.querySelectorAll(".paths");
    //get folder paths from db
    getFolderLocation("people").then((value) => {
      //now load the data into the spans
      locationDisplayArr[0].innerHTML = value;
    });

    getFolderLocation("transportation").then((value) => {
      //now load the data into the spans
      locationDisplayArr[1].innerHTML = value;
    });

    getFolderLocation("popular").then((value) => {
      //now load the data into the spans
      locationDisplayArr[2].innerHTML = value;
    });

    //get option from dropdown
    let chosenActivityType = document.querySelector("#category-dropdown").value;
    console.log(chosenActivityType);

    getFolderLocation(chosenActivityType).then((value) => {
      //now load the data into the spans
      locationDisplayArr[3].innerHTML = value;
    });
  } else {
    console.log("not the settings page");
  }
}

slider.oninput = function () {
  output.innerHTML = this.value + "ms";
};

slider.onchange = function () {
  setHoldValue(this.value).then((isUpdated) => {
    output.innerHTML = this.value + "ms";
    if (!isUpdated) console.log("ERROR: new value wasn't saved in DB");
  });
};

initializeSettings();
