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
// Array of elements that have already been dragged onto the calendar from the libraray
var copies = [];
// Cells of the calendar table
const containers = document.querySelectorAll('div.p1 table tr td');
// Images that can be dragged from the library
const draggables = document.querySelectorAll('div.sidemenu table tr td img');

//test
let imagesInLibrary = document.getElementsByClassName('img-lib');
let imageArray = [];

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
 * - Kyle
 */
function clickDrag() {
  //console.log('click and drag event triggered!!');
  Array.prototype.forEach.call(imagesInLibrary, (image) => {
    //console.log(`Selected image:\n${image.classList}`);
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
        image.classList.add(`${parent.parentNode.getAttribute("id")}-copy`);
      }

      image.style.position = 'absolute';
      image.style.zIndex = 2;
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
        }else {
          image.style.zIndex = 0; //Drop the image below the sidebar
        }
      };

      image.ondragstart = function () {
        return false;
      };
    };
  });
}

// Fully implementing this/next week feature
function moveIntoNextWeek() {
  if (copies.length == 0) {
    // Storing an original version of the calendar (empty) when the app first opens
    localStorage.setItem('og', document.body.innerHTML);
    convertedToHTML = new DOMParser().parseFromString(
      localStorage.getItem('og'),
      'text/html'
    );
  }
  var dateToday = new Date();
  if (dateToday.getDay() == 1 && localStorage.getItem('reset2?') == 'false') {
    // It is monday and the week hasn't been reset yet so we need to reset the next week schedule

    localStorage.setItem('reset?', 'true');
  } else if (dateToday.getDay() != 1) {
    // It is not monday, so we can say that the week hasn't been reset yet
    localStorage.setItem('reset?', 'false');
  }
  // Note: there is no option for if the day is monday and the week has been reset yet because we wouldn't
  // need to do anything then
}

/*
 *	Author: Ken Orsini
 *	Dynamically adding html elements
 */
const ipcRenderer = require('electron').ipcRenderer;
const addImages = async (category) => {
  const row = document.getElementById(category + '-imgs-row');
  ipcRenderer.invoke('load-images', category).then((images) => {
    for (const image of images) {
      row.innerHTML +=
        '<td>' +
        `<img src="${image[0]}" ` +
        `id="${image[1]}" ` +
        `alt="${image[2]}" ` +
        'class="img-lib" onmousedown="clickDrag()"></td>';
    }
  });
};

addImages('people');
addImages('transportation');
addImages('popular');
addImages('activities');
/***************************************************************** */

// Invoke all methods needed to boot up app
moveIntoNextWeek();
//check for new clones every 3 secs
setInterval(() => {
  clickDrag();
}, 1000);