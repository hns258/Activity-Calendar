//global variables
var open = false;
let leftSideMenu = document.querySelector(".sidemenu");
let sideBarImg = document.querySelector(".sidebar");
var isLeft = false;
const sideToggleBtn = document.querySelector(".isLeftToggle");

// this function is to transition settings sidebar from right to left side of screen
function switchToLeft(){
    console.log(leftSideMenu);
    console.log("toggle has been clicked!");
    //reset isLeft based on 
    isLeft = sideToggleBtn.checked;
    console.log(isLeft);
    //when toggle is clicked
    if(isLeft){
        //left settings should be on
        //swap classes to -left
        leftSideMenu.classList.remove("sidemenu");
        leftSideMenu.classList.add("menuOnLeft");
        //swap bar classes too
        sideBarImg.classList.remove("sidebar");
        sideBarImg.classList.add("barOnLeft");
        //set the toggle btn based on new class
        leftSideMenu = document.querySelector(".menuOnLeft");
        sideBarImg = document.querySelector(".barOnLeft");
        //set the toggle to OFF (grey side)
        sideToggleBtn.checked = false;
        console.log(sideToggleBtn);
        //set isLeft boolean to TRUE
        isLeft = true;
    }else{
        //left settings should be off
        //swap classes to default
        leftSideMenu.classList.remove("menuOnLeft");
        leftSideMenu.classList.add("sidemenu");
        //set the toggle btn based on new class
        leftSideMenu = document.querySelector(".sidemenu");
        //set toggle to ON (checked/blue side)
        sideToggleBtn.checked = true;
        console.log(sideToggleBtn);
        //set isLeft boolean to FALSE
        isLeft = false;
    }
}

//open the settings page from the sidebar button
function goToSettings(){
    window.location.href = "settings.html";
}