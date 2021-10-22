var mouseInArea = false;

function deletionBoxCheck(){

    var eventDoc, doc, body;
    var event = window.event; 
    var offsets = document.getElementById('deletionBoxRow').getBoundingClientRect();

        // Calculate location of event triggered by mouse
        if (event.pageX == null && event.clientX != null) {
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = event.clientX +
              (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
              (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
              (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
              (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }
        
        // Get element to be manipulated
        var myObj = document.getElementById('trash-box-container');

        // Check delete div offset and compare to event location
        if(offsets.height < event.pageY){
            mouseInArea = false;
            myObj.style.display = "none";
        }
        else {
            console.log("mouse in deletion area");
            myObj.style.display = "flex";
        }
    }

function dismissDeleteDiv() {
    document.getElementById('trash-box-container').style.display = "none";
}
