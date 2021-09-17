var mouseInArea = false;
function initializeDeletionBox(){
    /* Should look like this:
        <div class="trash-box-container deletion-box" id="trash-box-container">
            <div class="trash-box">DELETE <i class="fas fa-trash-alt"></i></div>
        </div>
    */
   mouseInArea = true;
   if(mouseInArea === true){
       console.log("mouse in deletion area");
       var trashBoxContainer = document.createElement('div');
       trashBoxContainer.id = 'trash-box-container';
       trashBoxContainer.classList.add('trash-box-container', 'deletion-box');
       var trashBox = document.createElement('div');
       trashBox.classList.add('trash-box');
       trashBox.innerHTML = `DELETE <i class="fas fa-trash-alt"></i>`;
       trashBoxContainer.appendChild(trashBox);
       document.getElementById('p1').appendChild(trashBoxContainer);
   }
}

function removeDeletionBox(){
    var myObj = document.getElementById('trash-box-container');
    myObj.remove();
    setTimeout(()=>{
        mouseInArea = false;
        console.log("mouse position in trash area has been reset");
    }, 1000);
}