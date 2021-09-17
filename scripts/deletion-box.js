var mouseInArea = false;
function initializeDeletionBox(){
    var myObj = document.getElementById('trash-box-container');
    mouseInArea = true;
    if(mouseInArea === true){
        console.log("mouse in deletion area");
        myObj.style.display = "flex";
    }
}

function removeDeletionBox(){
    var myObj = document.getElementById('trash-box-container');
    setTimeout(()=>{
        mouseInArea = false;
        myObj.style.display = "none";
        console.log("mouse position in trash area has been reset");
    }, 200);
    setTimeout(()=>{
        myObj.classList.remove("trash-box-container-inside");
    }, 1000);
}