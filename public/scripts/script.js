/**
 * Activity Calendar App
 * 2021-08-31
 * PM: Jack Everard
 * Developers: Vaaranan Yogalingam, Kyle Flores, Azhya Knox
 */

//gets current page
var path = window.location.pathname;
var page = path.split('/').pop();

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
let imageArray;
let deleteBox = document.getElementById('trash-box-container');

/*****************************************************************/
/* IPC FUNCTIONS + Node Imports */
const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');
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
        'class="img-lib"></td>';
    }
  });
};

/* Jagoda - implement the following three functions into the frontend script */
// Call to save or update image copy in database
// returns true if database save was successful
const setImageCopy = async (imageCopyID, baseID, posX, posY, weekType) => {
  return ipcRenderer
    .invoke('set-image-copy', imageCopyID, baseID, posX, posY, weekType)
    .then((isSaved) => {
      return isSaved;
    });
};

// Call to delete image copy in database
// returns true if database deletion was successful
const deleteImageCopy = async (imageCopyID) => {
  return ipcRenderer
    .invoke('delete-image-copy', imageCopyID)
    .then((isDeleted) => {
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
async function getImageCopyModels() {
  let weekIndicator = document.querySelector('#hdnWeek').value;
  ipcRenderer
    .invoke('load-image-copies', weekIndicator)
    .then((imageCopyArray) => {
      imageCopyArray.forEach((item) => {
        if (fs.existsSync(item[0])) {
          let elem = document.createElement('img');
          elem.src = item[0];
          elem.setAttribute('clone-id', item[1]);
          elem.setAttribute('data-id', item[2]);
          elem.alt = item[5];
          elem.classList.add('img-lib');
          elem.classList.add('copy');
          elem.classList.add(`${item[6]}-imgs-row-copy`);
          elem.style.position = 'absolute';
          elem.style.zIndex = 0;
          elem.style.width = '4.9vw';
          elem.style.objectFit = 'scale-down';
          document.body.append(elem);
          elem.style.left = parseInt(item[3]) - elem.offsetWidth / 2 + 'px';
          elem.style.top = parseInt(item[4]) - elem.offsetHeight / 2 + 'px';
        }
      });
    });
}

/*****************************************************************/

// Initializing the date functionality of the app
// Note how sunday is a special case (in the Date library, Sunday = 0, Monday = 1, etc. but in our calendar, "This week" = 0, Monday = 1, ... Sunday = 7)
function setUpDate() {
  if (page === 'index.html') {
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
}

// Slide-in library menu functionality initialization
function toggleSidemenu() {
  if (!isLeft) {
    if (open) {
      console.log('closing sidebar to right');
      sideMenu.style.right = '-29vw';
      open = false;
      document
        .querySelector('#divSidemenu')
        .setAttribute('sidemenu-is-visible', false);
    } else {
      console.log('opening sidebar to right');
      sideMenu.style.right = '0px';
      open = true;
      document
        .querySelector('#divSidemenu')
        .setAttribute('sidemenu-is-visible', true);
    }
  } else {
    if (open) {
      console.log('closing sidebar to left');
      sideMenu.style.left = '-28.5vw';
      open = false;
      document
        .querySelector('#divSidemenu')
        .setAttribute('sidemenu-is-visible', false);
    } else {
      console.log('opening sidebar to left');
      sideMenu.style.left = '0px';
      open = true;
      document
        .querySelector('#divSidemenu')
        .setAttribute('sidemenu-is-visible', true);
    }
  }

  if (open) {
    clickDrag(); //Bug fix: dragging image for the first time
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
  Array.prototype.forEach.call(imagesInLibrary, (image) => {
    const dragStart = (event) => {
      if (!image.classList.contains('copy')) {
        console.log('making clone and moving copy');
        //clone itself and append clone in its original spot
        const clone = image.cloneNode(true);
        clone.setAttribute('listener', 'false');
        let parent = image.parentNode;
        parent.append(clone);

        //add clone to imageLibrary array
        imageArray = Array.from(imagesInLibrary);
        //remove image and add clone
        imageArray = imageArray.filter((element) => element !== image);
        imageArray.push(clone);
        //finally add copy class to image
        image.classList.add('copy');
        image.classList.add(`${parent.parentNode.getAttribute('id')}-copy`);
        image.setAttribute('clone-id', randomUUID());
      }

      image.style.position = 'absolute';
      image.style.zIndex = 2;
      image.style.width = '4.9vw';
      image.style.objectFit = 'scale-down';
      document.body.append(image);
      if (
        document
          .querySelector('#divSidemenu')
          .getAttribute('sidemenu-is-visible') === 'false'
      ) {
        showDeletionBox();
      }

      function moveAt(pageX, pageY) {
        image.style.left = pageX - image.offsetWidth / 2 + 'px';
        image.style.top = pageY - image.offsetHeight / 2 + 'px';
      }

      // move our absolutely positioned image under the pointer
      moveAt(event.targetTouches[0].pageX, event.targetTouches[0].pageY);

      function onTouchMove(moveEvent) {
        moveAt(
          moveEvent.targetTouches[0].pageX,
          moveEvent.targetTouches[0].pageY
        );
      }

      // (2) move the image on mousemove
      document.addEventListener('touchmove', onTouchMove);
      var toggleBarPageX = document.getElementById("toggleBar").getBoundingClientRect().x;

      // (3) drop the image, remove unneeded handlers
      const dragEnd = (endEvent) => {
        hideDeletionBox();
        document.removeEventListener('touchmove', onTouchMove);
        //check if in deletion area
        if (endEvent.changedTouches[0].pageY < 100 && open === false) {
          var copyImageId = image.getAttribute('clone-id');
          deleteImageCopy(copyImageId).then(function (value) {
            if (value) {
              console.log(value);
              document.body.removeChild(image);
            } else alert('An error occurred, the image could not be deleted from the database.');
          });
        } 
        // Check if image dropped within sidebar and remove if true
        else if ((open && endEvent.changedTouches[0].pageX > toggleBarPageX)) {
          document.body.removeChild(image);
        } else {
          var copyImageId = image.getAttribute('clone-id');
          var baseId = image.getAttribute('data-id');
          var weekType = document.getElementById('hdnWeek').value;

          setImageCopy(
            copyImageId,
            baseId,
            endEvent.changedTouches[0].pageX,
            endEvent.changedTouches[0].pageY,
            weekType
          ).then(function (value) {
            if (value) {
              console.log(value);
            } else {
              alert('An error occurred, the image could not be saved.');
            }
          });
          image.style.zIndex = 0; //Drop the image below the sidebar
        };

        event.target.removeEventListener('touchend', dragEnd);
      };
      image.addEventListener('touchend', dragEnd);

      image.ondragstart = function () {
        return false;
      };
    };
    if (image.getAttribute('listener') !== 'true') {
      image.addEventListener('touchstart', dragStart);
      image.setAttribute('listener', 'true');
    }
  });
}

function showDeletionBox() {
  document.getElementById('trash-box-container').style.display = 'flex';
  console.log('Show deletion box triggered.');
}

function hideDeletionBox() {
  document.getElementById('trash-box-container').style.display = 'none';
  console.log('Hide deletion box triggered.');
}


// Populate each category of image library
populateImageLibrary('people');
populateImageLibrary('transportation');
populateImageLibrary('popular');
populateImageLibrary('activities');

// Invoke all methods needed to boot up app
setUpDate();
getImageCopyModels();

//check for new clones every 3 secs
setInterval(() => {
  clickDrag();
}, 1000);
