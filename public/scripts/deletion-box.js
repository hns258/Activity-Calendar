var mouseInArea = false;
var mouseInArea2 = false;

function initializeDeletionBox() {
  var myObj = document.getElementById("trash-box-container");
  mouseInArea = true;

  var element = document.querySelector(".sidemenu") || null;
  if (element === null) {
    //call reverse check here
    initializeDeletionBox_L();
  } else {
    var isClosed = false;
    if (element.computedStyleMap().get("right") < "0px") {
      isClosed = true;
    } else if (element.computedStyleMap().get("right") >= "0px") {
    }

    if (mouseInArea === true && isClosed === true) {
      myObj.style.display = "flex";
    } else {
    }
  }
}

function initializeDeletionBox_L() {
  var myObj2 = document.getElementById("trash-box-container");
  mouseInArea2 = true;

  var element2 = document.querySelector(".menuOnLeft");

  var isClosed2 = false;
  if (element2.computedStyleMap().get("left") < "0px") {
    isClosed2 = true;
  } else if (element2.computedStyleMap().get("left") >= "0px") {
  }

  if (mouseInArea2 === true && isClosed2 === true) {
    myObj2.style.display = "flex";
  } else {
  }
}

function removeDeletionBox() {
  var myObj = document.getElementById("trash-box-container");
  setTimeout(() => {
    mouseInArea = false;
    myObj.style.display = "none";
  }, 200);
  setTimeout(() => {
    myObj.classList.remove("trash-box-container-inside");
  }, 1000);
}
