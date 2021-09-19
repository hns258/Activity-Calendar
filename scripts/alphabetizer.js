//this function will alphabetize people based on filename
function abcPeoplePics(){
    console.log(`now alphabetizing the people images...`);
    //1. make a get request for current user setting info
    //make AJAX request to get current data
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        console.log('ReadyState: ' + xhr.readyState);
        if (xhr.readyState <= 3) {
            console.log('loading');
        }
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log(`Success!\n${xhr.responseText}`);
            //var settings = localStorage.setItem('userSettings', xhr.responseText);
            var peopleJSON = JSON.parse(xhr.responseText);
            console.log(peopleJSON);
            //2. append images based on new sorted list into table row
            var peopleTableRow = document.querySelector("#people-imgs-row");
            peopleJSON.forEach((item, index)=>{
                console.log(`PEOPLE ${index}: ${item}`);
                var tableDiv = document.createElement("td");
                var img = document.createElement("img");
                img.src = item;
                tableDiv.appendChild(img);
                peopleTableRow.appendChild(tableDiv);
            });
            console.log(peopleTableRow);
            console.log("finished!");
        }
        if (xhr.readyState === 4 && xhr.status !== 200) {
            console.log("Failed. Status Code: " + xhr.status)
            var reason = {
                code: xhr.status,
                issue: 'Failed to load table data from server.'
                //redirect to error page
            };
            console.log(reason);
            sessionStorage.setItem('failMessage', JSON.stringify(reason));
            console.log(sessionStorage.getItem('failMessage'));
        }
        console.log("Processing")
    };
    xhr.open("GET", "https://ac-db-server2.aaknox.repl.co/abc-people", true);
    xhr.send();
}

//call all alphabetizer methods at startup
abcPeoplePics();