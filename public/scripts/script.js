/**
 * Activity Calendar App
 * 2021-08-31
 * PM: Jack Everard
 * Developers: Vaaranan Yogalingam, Kyle Flores, Azhya Knox
 */

// Initializing variables and constants
var open = false;
var isLeft = document.querySelector('.isLeftToggle').checked;
var itemCount = 0;
const sideMenu = document.querySelector('.sidemenu');

// Coordinates of the currently selected element
var x = 0;
var y = 0;
// Index of element being dragged (i.e. its position relative to all the other images in the side menu library)
var currentElement = 0;
// Element being dragged currently OR last element that was dragged
var toDrag = null;
// Array of elements that have already been dragged onto the calendar from the library
var copies = [];
// Cells of the calendar table
const containers = document.querySelectorAll('div.p1 table tr td');
// Images that can be dragged from the library
const draggables = document.querySelectorAll('div.sidemenu table tr td img');
//test
let imagesInLibrary = document.getElementsByClassName('img-lib');
let imageArray = [];
let deleteBox = document.getElementById('trash-box-container');

/*****************************************************************/
/* IPC FUNCTIONS + Node Imports */
const ipcRenderer = require('electron').ipcRenderer;
const { randomUUID } = require('crypto'); // returns random UUID as string on call

// Populates image library with images from database
// TODO: Change innerHTML to use code from image copy
const populateImageLibrary = async (category) => {
  const row = document.getElementById(category + '-imgs-row');
  ipcRenderer.invoke('load-images', category).then((images) => {
    for (const image of images) {
      row.innerHTML +=
        '<td>' +
        `<img src="${image[0]}" ` +
        `data-id="${image[1]}" ` +
        `alt="${image[2]}" ` +
        'class="img-lib" onmousedown="clickDrag()"></td>';
    }
  });
};

/* Jagoda - implement the following three functions into the frontend script */
// Call to save or update image copy in database
// returns true if database save was successful
const setImageCopy = async (imageCopyID, baseID, posX, posY) => {
  ipcRenderer
    .invoke('set-image-copy', imageCopyID, baseID, posX, posY, 1)
    .then((isSaved) => {
      return isSaved;
    });
};

// Call to delete image copy in database
// returns true if database deletion was successful
const deleteImageCopy = async (imageCopyID) => {
  ipcRenderer.invoke('delete-image-copy', imageCopyID).then((isDeleted) => {
    return isDeleted;
  });
};

// Call to return image copy model from database
// Returns image copy array
//    array[i][0] = image path
//    array[i][1] = image copy ID
//    array[i][2] = base image ID
//    array[i][3] = position x
//    array[i][4] = position y
//    array[i][5] = file name
const getImageCopyModels = async () => {
  ipcRenderer.invoke('load-image-copies', 1).then((imageCopyArray) => {
    return imageCopyArray;
  });
};

/*****************************************************************/

// Initializing the date functionality of the app
// Note how sunday is a special case (in the Date library, Sunday = 0, Monday = 1, etc. but in our calendar, "This week" = 0, Monday = 1, ... Sunday = 7)
function setUpDate() {
  var dateToday = new Date();
  var day = dateToday.getDay();
  const days = document.querySelectorAll('div.p1 table tr th');
  if (day == 0) {
    var sunday = 7;
    days[sunday].style.backgroundColor = '#c5e6f5';
    for (var i = sunday - 1; i < 21; i += 7) {
      containers[i].style.backgroundColor = '#c5e6f5';
    }
  } else {
    days[day].style.backgroundColor = '#c5e6f5';
    for (var i = day - 1; i < 21; i += 7) {
      containers[i].style.backgroundColor = '#c5e6f5';
    }
  }
}

// Slide-in library menu functionality initialization
function toggleSidemenu() {
  console.log('sidebar has been clicked');
  console.log(`open set to: ${open} and isLeft set to: ${isLeft}`);
  console.log(sideMenu);

  if (!isLeft) {
    if (open) {
      console.log('closing sidebar to right');
      sideMenu.style.right = '-29vw';
      open = false;
    } else {
      console.log('opening sidebar to right');
      sideMenu.style.right = '0px';
      open = true;
    }
  } else {
    if (open) {
      console.log('closing sidebar to left');
      sideMenu.style.left = '-28.5vw';
      open = false;
    } else {
      console.log('opening sidebar to left');
      sideMenu.style.left = '0px';
      open = true;
    }
  }
}

/* TODO: Switch touchstart, etc. events to their mouse-based equivalents
 * A list of some DOM JS event handlers can be found here:
 * https://www.w3schools.com/jsref/dom_obj_event.asp
 *
 * For now, the plan is:
 * > touchstart becomes dragstart
 * > touchmove becomes drag
 * > touchend becamse dragend
 *
 * Update September 18, 2021:
 *
 * See here on how to implement drag and drop with mouse events instead of drag events:
 * https://javascript.info/mouse-drag-and-drop
 *
 * Update September 19, 2021:
 *
 * The mouse event handlers need to be separated into their own functions,
 * possibly away from the for loops that added the event handlers in the first place.
 *
 * - Kyle
 */

function clickDrag() {
  console.log('click and drag event triggered!!');
  Array.prototype.forEach.call(imagesInLibrary, (image) => {
    console.log(`Selected image:\n${image.classList}`);
    image.onmousedown = (event) => {
      if (!image.classList.contains('copy')) {
        console.log('making clone and moving copy');
        //clone itself and append clone in its original spot
        const clone = image.cloneNode(true);
        let parent = image.parentNode;
        parent.append(clone);

        //add clone to imageLibrary array
        imageArray = Array.from(imagesInLibrary);
        //remove image and add clone
        imageArray = imageArray.filter((element) => element !== image);
        imageArray.push(clone);
        //finally add copy class to image
        image.classList.add('copy');
      }

      image.style.position = 'absolute';
      image.style.zIndex = 1000;
      image.style.width = '4.9vw';
      image.style.width = '7.9vh';
      image.style.objectFit = 'scale-down';
      document.body.append(image);

      function moveAt(pageX, pageY) {
        image.style.left = pageX - image.offsetWidth / 2 + 'px';
        image.style.top = pageY - image.offsetHeight / 2 + 'px';
      }

      // move our absolutely positioned image under the pointer
      moveAt(event.pageX, event.pageY);

      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
        console.log(`Image Coordinates: ${event.pageX}, ${event.pageY}`);
      }

      // (2) move the image on mousemove
      document.addEventListener('mousemove', onMouseMove);

      // (3) drop the image, remove unneeded handlers
      image.onmouseup = function (event) {
        document.removeEventListener('mousemove', onMouseMove);
        image.onmouseup = null;
        //check if in deletion area
        if (event.pageY < 100 && open === false) {
          image.style.display = 'none';
        }
      };

      image.ondragstart = function () {
        return false;
      };
    };
  });
}

// Reloads latest version
function reloadPreviousCalendar() {
  // Get latest version of the body of the calendar app
  var latestBody = localStorage.getItem('latest version');
  // After "</script>" is when the newly added images appear, which is what we want to load when opening the app (these images are stored in index 1 of the array)
  x = latestBody.split('</script>');
  // Convert the string containing the images we want to load into actuall html (now stored in the body of some sample HTML)
  convertedToHTML = new DOMParser().parseFromString(x[1], 'text/html');
  // Store the actual image elements in an array of image elements what we will now load
  imagesToLoad = convertedToHTML.body.children;
  // Append each image to the body (note that after appending one element from the array, you also remove that element from the array, which is why this for loop is strange)
  for (var i = 0; imagesToLoad.length != 0; i += 0) {
    copies.push(imagesToLoad[i]);
    updateCopies();
    document.body.append(imagesToLoad[i]);
  }
}

// Fully implementing this/next week feature
function moveIntoNextWeek() {
  var dateToday = new Date();
  if (dateToday.getDay() == 1 && localStorage.getItem('reset1?') == 'false') {
    // It is monday and the week hasn't been reset yet so we need to move next week's schedule to this week
    var newThisWeek = localStorage.setItem('latest version 2');
    localStorage.setItem('latest version', newThisWeek);
    localStorage.setItem('reset1?', 'true');
  } else if (dateToday.getDay() != 1) {
    // It is not monday, so we can say that the week hasn't been reset yet
    localStorage.setItem('reset1?', 'false');
  }
  // Note: there is no option for if the day is monday and the week has been reset yet because we wouldn't
  // need to do anything then
}

// Populate each category of image library
populateImageLibrary('people');
populateImageLibrary('transportation');
populateImageLibrary('popular');
populateImageLibrary('activities');

// Invoke all methods needed to boot up app
setUpDate();
reloadPreviousCalendar();
moveIntoNextWeek();
//check for new clones every 3 secs
setInterval(() => {
  clickDrag();
  console.log('image check complete');
}, 3000);

/**
 * SAVING AND RELOADING DATA
 *
 * to get latest version, recall localStorage.setItem("latest version", document.body.innerHTML);
 * therefore do the following
 * 1. var latestBody = localStorage.getItem("latest version")
 * 2. x = latestBody.split("</script>\n")
 * 3. Parse this string as so:
 * 		imagesToAdd = new DOMParser().parseFromString(x[1], 'text/html');
 * 4. Now the images are stored as elements in 'document.body.children'
 * 5.copies.push(imagesToAdd.body.children[x]) AND updateCopies() where x goes from 0 to length of array
 * 6. document.body.append(imagesToAdd.body.children[x]);
 */

// * Now you have a string containing all the latest images
// * y = x[1].split(">")
// * for(var i = 0; i < x.length() - 1; i += 1){
// 	   y[i] += '>'
//    }
// * images = [];
// * for(var i = 0; i < x.length() - 1; i += 1){
// 		 imageToAdd = new DOMParser().parseFromString(y[i], 'text/xml');
// 	   images.push()
//    }

// a = imagesToAdd.body.children
// for(var i = 0; i < 6; i += 1){
// 	copies.push(a[i]);
// 	updateCopies();
// }
