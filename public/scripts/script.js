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
const containers = document.querySelectorAll(
	'div.p1 table tr td:not(.extra-col)'
);
// Images that can be dragged from the library
const draggables = document.querySelectorAll('div.sidemenu table tr td img');
//test
let imagesInLibrary = document.getElementsByClassName('img-lib');
let imageArray;
let deleteBox = document.getElementById('trash-box-container');

// delay variable for image hold
let delay;
let touchDelay;

/*****************************************************************/
/* IPC FUNCTIONS + Node Imports */
const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');
const {randomUUID} = require('crypto'); // returns random UUID as string on call

ipcRenderer.invoke('get-hold-value').then((holdValue) => {
	touchDelay = holdValue;
});

// Populates image library with images from database
const populateImageLibrary = async (category) => {
	if (
		category === 'people' ||
		category === 'transportation' ||
		category === 'popular'
	) {
		const row = document.getElementById(category + '-imgs-row');
		populateRow(row, category);
	} else {
		const tableBody = document.getElementById('img-library-table');
		const th = document.createElement('th');
		const tr = document.createElement('tr');
		th.setAttribute('colspan', '4');
		th.setAttribute('id', 'activities-img-row-title');
		th.classList.add('img-row-title');
		const title = category.split('-');
		let newTitle = '';
		for (let i = 0; i < title.length; i++) {
			title[i] = title[i].charAt(0).toUpperCase() + title[i].slice(1);
			if (i === title.length - 1) {
				newTitle += title[i];
			} else newTitle += title[i] + ' & ';
		}
		th.innerHTML = newTitle;
		tr.appendChild(th);
		tableBody.appendChild(tr);
		const imgRow = document.createElement('tr');
		imgRow.setAttribute('id', 'activities-imgs-row');
		tableBody.appendChild(imgRow);
		populateRow(imgRow, category);
	}
};

const populateRow = (rowToModify, category) => {
	ipcRenderer.invoke('load-images', category).then((images) => {
		for (const image of images) {
			rowToModify.innerHTML +=
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
					switch (item[6]) {
						case 'transportation':
						case 'people':
						case 'popular':
							elem.classList.add(`${item[6]}-imgs-row-copy`);
							break;

						default:
							elem.classList.add(`activities-imgs-row-copy`);
							break;
					}
					elem.style.position = 'absolute';
					elem.style.zIndex = 0;
					elem.style.width = '4.9vw';
					elem.style.objectFit = 'scale-down';
					document.body.append(elem);
					setTimeout(() => {
						elem.style.left = parseInt(item[3]) - elem.offsetWidth / 2 + 'px';
						elem.style.top = parseInt(item[4]) - elem.offsetHeight / 2 + 'px';
					}, 0.00001);
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
		const days = document.querySelectorAll(
			'div.p1 table tr th:not(.extra-col)'
		);
		//exclude extra-col from list
		console.log(days);
		console.log(containers);
		if (day == 0) {
			var sunday = 7;
			days[sunday].style.backgroundColor = '#c5e6f5';
			for (var i = sunday - 1; i < 21; i += 7) {
				containers[i].style.backgroundColor = '#c5e6f5';
			}
		} else {
			days[day].style.backgroundColor = '#c5e6f5';
			for (var j = day - 1; j < 21; j += 7) {
				containers[j].style.backgroundColor = '#c5e6f5';
			}
		}
	}
}

// Slide-in library menu functionality initialization
function toggleSidemenu() {
	if (!isLeft) {
		if (open) {
			console.log('closing sidebar to right');
			sideMenu.style.right = '-30vw';
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
			sideMenu.style.left = '-29.5vw';
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

const dragStartEvents = ['touchstart', 'mousedown'];
const dragMoveEvents = ['touchmove', 'mousemove'];
const dragEndEvents = ['touchend', 'mouseup'];

function clickDrag() {
	Array.prototype.forEach.call(imagesInLibrary, (image) => {
		function removeDelayChecks(event) {
				clearTimeout(delay);

			dragEndEvents.forEach(event => image.removeEventListener(event, removeDelayChecks));
			dragMoveEvents.forEach(event => document.removeEventListener(event, removeDelayChecks));
		}

		const dragStart = (event) => {
			removeDelayChecks(event);

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
				dragStartEvents.forEach(event => {
					image.removeEventListener(event, dragDelay);
					image.addEventListener(event, dragStart);
				});

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
				document.querySelector('#divSidemenu')
				//.getAttribute('sidemenu-is-visible') === 'false'
			) {
				showDeletionBox();
			}

			function centerImageAt(pageX, pageY) {
				image.style.left = pageX - image.offsetWidth / 2 + 'px';
				image.style.top = pageY - image.offsetHeight / 2 + 'px';
			}

			event.preventDefault();

			function centerImageUnderPointer(event) {
				const {pageX, pageY} = event instanceof TouchEvent ?
					event.changedTouches[0] :
					event;
				centerImageAt(pageX, pageY);
			}

			centerImageUnderPointer(event);

			// (2) move the image on mousemove
			dragMoveEvents.forEach(event =>
				document.addEventListener(event, centerImageUnderPointer));
			var toggleBarPageX = document
				.getElementById('toggleBar')
				.getBoundingClientRect().x;

			const deletionContainer = document.getElementsByClassName('trash-box-container');
			if (deletionContainer.length == 0) { // this shouldn't happen but just in case
				throw new Error('Unable to find element trash-box-container by class name');
			}
			const deletionBox = document.getElementsByClassName('trash-box-container')[0];
			const deletionBoxBottom = deletionBox.getBoundingClientRect().bottom;
			console.debug(`DeletionBox bottom (Y coord): ${deletionBoxBottom}`);

			// (3) drop the image, remove unneeded handlers
			const dragEnd = (endEvent) => {
				hideDeletionBox();
				dragMoveEvents.forEach(event =>
					document.removeEventListener(event, centerImageUnderPointer));

				//check if in deletion area
				const {pageX, pageY} = endEvent instanceof TouchEvent ?
					endEvent.changedTouches[0] :
					endEvent;

				console.debug(`Image (x, y): (${pageX}, ${pageY})`);

				if (pageY < deletionBoxBottom) {
					const copyImageId = image.getAttribute('clone-id');
					deleteImageCopy(copyImageId).then(function(value) {
						if (value) {
							console.log(value);
							document.body.removeChild(image);
						} else alert('An error occurred, the image could not be deleted from the database.');
					});
				// Check if image dropped within sidebar and remove if true
				} else if (open && (pageX < toggleBarPageX) == isLeft) {
					document.body.removeChild(image);
				} else {
					var tempCopyImageId = image.getAttribute('clone-id');
					var baseId = image.getAttribute('data-id');
					var weekType = document.getElementById('hdnWeek').value;

					setImageCopy(
						tempCopyImageId,
						baseId,
						pageX,
						pageY,
						weekType,
					).then(function(value) {
						if (value) {
							console.log(value);
						} else {
							alert('An error occurred, the image could not be saved.');
						}
					});
					image.style.zIndex = 0; //Drop the image below the sidebar
				}
				dragEndEvents.forEach(dragEndEvent =>
					event.target.removeEventListener(dragEndEvent, dragEnd));
			};
			dragEndEvents.forEach(event => image.addEventListener(event, dragEnd));

			image.ondragstart = function() {
				return false;
			};
		};

		function dragDelay(event) {
			console.log(`touchDelay: ${touchDelay}`);
			if (event instanceof MouseEvent) {
				dragStart(event);
			} else {
				delay = setTimeout(dragStart, touchDelay, event);
			}

			dragEndEvents.forEach(event => image.addEventListener(event, removeDelayChecks));
			dragMoveEvents.forEach(event => document.addEventListener(event, removeDelayChecks));
		}

		if (image.getAttribute('listener') !== 'true') {
			const dragEvent = image.classList.contains('copy') ? dragStart : dragDelay;
			dragStartEvents.forEach(event => image.addEventListener(event, dragEvent));
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
populateImageLibrary('cafe-restaurants');
populateImageLibrary('parks-greenspace');
populateImageLibrary('arts-education');
populateImageLibrary('volunteering-community');
populateImageLibrary('entertainment');
populateImageLibrary('activities-sports');
populateImageLibrary('holiday-travel');
populateImageLibrary('places');
populateImageLibrary('other');

// Invoke all methods needed to boot up app
setUpDate();
getImageCopyModels();

//check for new clones every 3 secs
setInterval(() => {
	clickDrag();
}, 1000);
