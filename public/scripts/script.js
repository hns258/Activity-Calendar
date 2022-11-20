var open = false;
var isLeft = document.querySelector(".isLeftToggle").checked;
const sideMenu = document.querySelector(".sidemenu");

let imagesInLibrary = document.getElementsByClassName("img-lib");

// delay variable for image hold
let delay;
let touchDelay;

const ipcRenderer = require("electron").ipcRenderer;
const fs = require("fs");
const { randomUUID } = require("crypto");

ipcRenderer.invoke("get-hold-value").then((holdValue) => {
  touchDelay = holdValue;
});

const populateImageLibrary = async (category) => {
  if (
    category === "people" ||
    category === "transportation" ||
    category === "popular"
  ) {
    const row = document.getElementById(category + "-imgs-row");
    populateRow(row, category);
  } else {
    const tableBody = document.getElementById("img-library-table");
    const th = document.createElement("th");
    const tr = document.createElement("tr");
    th.setAttribute("colspan", "4");
    th.setAttribute("id", "activities-img-row-title");
    th.classList.add("img-row-title");
    const title = category.split("-");
    let newTitle = "";
    for (let i = 0; i < title.length; i++) {
      title[i] = title[i].charAt(0).toUpperCase() + title[i].slice(1);
      if (i === title.length - 1) {
        newTitle += title[i];
      } else newTitle += title[i] + " & ";
    }
    th.innerHTML = newTitle;
    tr.appendChild(th);
    tableBody.appendChild(tr);
    const imgRow = document.createElement("tr");
    imgRow.setAttribute("id", "activities-imgs-row");
    tableBody.appendChild(imgRow);
    populateRow(imgRow, category);
  }
};

const populateRow = (rowToModify, category) => {
  ipcRenderer.invoke("load-images", category).then((images) => {
    for (const image of images) {
      rowToModify.innerHTML +=
        "<td>" +
        `<img src="${image[0]}" ` +
        `data-id="${image[1]}" ` +
        `alt="${image[2]}" ` +
        'class="img-lib"></td>';
    }
  });
};

const setImageCopy = async (imageCopyID, baseID, posX, posY, weekType) => {
  return ipcRenderer
    .invoke("set-image-copy", imageCopyID, baseID, posX, posY, weekType)
    .then((isSaved) => {
      return isSaved;
    });
};

const deleteImageCopy = async (imageCopyID) => {
  return ipcRenderer
    .invoke("delete-image-copy", imageCopyID)
    .then((isDeleted) => {
      return isDeleted;
    });
};

async function getImageCopyModels() {
  let weekIndicator = document.querySelector("#hdnWeek").value;
  ipcRenderer
    .invoke("load-image-copies", weekIndicator)
    .then((imageCopyArray) => {
      imageCopyArray.forEach((item) => {
        if (fs.existsSync(item[0])) {
          let elem = document.createElement("img");
          elem.src = item[0];
          elem.setAttribute("clone-id", item[1]);
          elem.setAttribute("data-id", item[2]);
          elem.alt = item[5];
          elem.classList.add("img-lib");
          elem.classList.add("copy");
          switch (item[6]) {
            case "transportation":
            case "people":
            case "popular":
              elem.classList.add(`${item[6]}-imgs-row-copy`);
              break;

            default:
              elem.classList.add(`activities-imgs-row-copy`);
              break;
          }
          elem.style.position = "absolute";
          elem.style.zIndex = 0;
          elem.style.width = "4.9vw";
          elem.style.objectFit = "scale-down";
          document.body.append(elem);
          setTimeout(() => {
            elem.style.left = parseInt(item[3]) - elem.offsetWidth / 2 + "px";
            elem.style.top = parseInt(item[4]) - elem.offsetHeight / 2 + "px";
          }, 0.00001);
        }
      });
    });
}

// Note how sunday is a special case (in the Date library, Sunday = 0, Monday = 1, etc. but in our calendar, "This week" = 0, Monday = 1, ... Sunday = 7)
function setUpDate() {
  var page = window.location.pathname.split("/").pop();

  if (page === "index.html") {
    var dateToday = new Date();
    var day = dateToday.getDay();
    const days = document.querySelectorAll(
      "div.p1 table tr th:not(.extra-col)"
    );
    //exclude extra-col from list
    console.log(days);

    const containers = document.querySelectorAll(
      "div.p1 table tr td:not(.extra-col)"
    );

    if (day == 0) {
      var sunday = 7;
      days[sunday].style.backgroundColor = "#c5e6f5";
      for (var i = sunday - 1; i < 21; i += 7) {
        containers[i].style.backgroundColor = "#c5e6f5";
      }
    } else {
      days[day].style.backgroundColor = "#c5e6f5";
      for (var j = day - 1; j < 21; j += 7) {
        containers[j].style.backgroundColor = "#c5e6f5";
      }
    }
  }
}

// Slide-in library menu functionality initialization
function toggleSidemenu() {
  sideMenu.style[isLeft ? "left" : "right"] = open
    ? isLeft
      ? "-29.5vw"
      : "-30vw"
    : "0px";

  document
    .querySelector("#divSidemenu")
    .setAttribute("sidemenu-is-visible", !open);

  open = !open;

  if (open) {
    // Accounts for dragging images for the first time.
    clickDrag();
  }
}

const dragStartEvents = ["touchstart", "mousedown"];
const dragMoveEvents = ["touchmove", "mousemove"];
const dragEndEvents = ["touchend", "mouseup"];

function clickDrag() {
  Array.prototype.forEach.call(imagesInLibrary, (image) => {
    function removeDelayChecks() {
      clearTimeout(delay);

      dragEndEvents.forEach((event) =>
        image.removeEventListener(event, removeDelayChecks)
      );
      dragMoveEvents.forEach((event) =>
        document.removeEventListener(event, removeDelayChecks)
      );
    }

    const dragStart = (event) => {
      removeDelayChecks();

      if (!image.classList.contains("copy")) {
        console.log("making clone and moving copy");
        //clone itself and append clone in its original spot
        const clone = image.cloneNode(true);
        clone.setAttribute("listener", "false");
        let parent = image.parentNode;
        parent.append(clone);

        //finally add copy class to image
        dragStartEvents.forEach((event) => {
          image.removeEventListener(event, dragDelay);
          image.addEventListener(event, dragStart);
        });

        image.classList.add("copy");
        image.classList.add(`${parent.parentNode.getAttribute("id")}-copy`);
        image.setAttribute("clone-id", randomUUID());
      }

      image.style.position = "absolute";
      image.style.zIndex = 2;
      image.style.width = "4.9vw";
      image.style.objectFit = "scale-down";
      document.body.append(image);

      showDeletionBox();

      function centerImageAt(pageX, pageY) {
        image.style.left = pageX - image.offsetWidth / 2 + "px";
        image.style.top = pageY - image.offsetHeight / 2 + "px";
      }

      event.preventDefault();

      function centerImageUnderPointer(event) {
        const { pageX, pageY } =
          event instanceof TouchEvent ? event.changedTouches[0] : event;
        centerImageAt(pageX, pageY);
      }

      centerImageUnderPointer(event);

      // (2) move the image on mousemove
      dragMoveEvents.forEach((event) =>
        document.addEventListener(event, centerImageUnderPointer)
      );
      var toggleBarPageX = document
        .getElementById("toggleBar")
        .getBoundingClientRect().x;

      const deletionContainer = document.getElementsByClassName(
        "trash-box-container"
      );
      if (deletionContainer.length == 0) {
        // this shouldn't happen but just in case
        throw new Error(
          "Unable to find element trash-box-container by class name"
        );
      }
      const deletionBox = document.getElementsByClassName(
        "trash-box-container"
      )[0];
      const deletionBoxBottom = deletionBox.getBoundingClientRect().bottom;
      console.debug(`DeletionBox bottom (Y coord): ${deletionBoxBottom}`);

      // (3) drop the image, remove unneeded handlers
      const dragEnd = (endEvent) => {
        hideDeletionBox();
        dragMoveEvents.forEach((event) =>
          document.removeEventListener(event, centerImageUnderPointer)
        );

        //check if in deletion area
        const { pageX, pageY } =
          endEvent instanceof TouchEvent
            ? endEvent.changedTouches[0]
            : endEvent;

        console.debug(`Image (x, y): (${pageX}, ${pageY})`);

        if (pageY < deletionBoxBottom) {
          const copyImageId = image.getAttribute("clone-id");
          deleteImageCopy(copyImageId).then(function (value) {
            if (value) {
              console.log(value);
              document.body.removeChild(image);
            } else alert("An error occurred, the image could not be deleted from the database.");
          });
          // Check if image dropped within sidebar and remove if true
        } else if (open && pageX < toggleBarPageX == isLeft) {
          document.body.removeChild(image);
        } else {
          var tempCopyImageId = image.getAttribute("clone-id");
          var baseId = image.getAttribute("data-id");
          var weekType = document.getElementById("hdnWeek").value;

          setImageCopy(tempCopyImageId, baseId, pageX, pageY, weekType).then(
            function (value) {
              if (value) {
                console.log(value);
              } else {
                alert("An error occurred, the image could not be saved.");
              }
            }
          );
          image.style.zIndex = 0; //Drop the image below the sidebar
        }
        dragEndEvents.forEach((dragEndEvent) =>
          event.target.removeEventListener(dragEndEvent, dragEnd)
        );
      };
      dragEndEvents.forEach((event) => image.addEventListener(event, dragEnd));

      image.ondragstart = function () {
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

      dragEndEvents.forEach((event) =>
        image.addEventListener(event, removeDelayChecks)
      );
      dragMoveEvents.forEach((event) =>
        document.addEventListener(event, removeDelayChecks)
      );
    }

    if (image.getAttribute("listener") !== "true") {
      const dragEvent = image.classList.contains("copy")
        ? dragStart
        : dragDelay;
      dragStartEvents.forEach((event) =>
        image.addEventListener(event, dragEvent)
      );
      image.setAttribute("listener", "true");
    }
  });
}

function showDeletionBox() {
  document.getElementById("trash-box-container").style.display = "flex";
  console.log("Show deletion box triggered.");
}

function hideDeletionBox() {
  document.getElementById("trash-box-container").style.display = "none";
  console.log("Hide deletion box triggered.");
}

// Populate each category of image library
populateImageLibrary("people");
populateImageLibrary("transportation");
populateImageLibrary("popular");
populateImageLibrary("cafe-restaurants");
populateImageLibrary("parks-greenspace");
populateImageLibrary("arts-education");
populateImageLibrary("volunteering-community");
populateImageLibrary("entertainment");
populateImageLibrary("activities-sports");
populateImageLibrary("holiday-travel");
populateImageLibrary("places");
populateImageLibrary("other");

// Invoke all methods needed to boot up app
setUpDate();
getImageCopyModels();

//check for new clones every 3 secs
setInterval(() => {
  clickDrag();
}, 1000);
