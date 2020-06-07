let database = []; // contains all fetched courses
let result = []; // Copy of database which will be manipulated by filtering and sorting
let studP = []; // All unique student points
let faculties = []; // All unique faculties

// Search object for filtering
let query = {
    filter: {
        name: "alle",
        faculty: "alle",
        points: "alle",
    },
    sort: {
        value: "none",
        order: "none",
    }
};

let resetResult = () => {result = Array.from(database)}; // Reset the filtering

function fetchData(){
    api_key = config.api_key // API key for gathering information
    if(database.length > 0){
        console.log("Data already loaded");
        return;
    }

    fetch('https://fs.data.uib.no/' + api_key + '/json/littl_emne/2020h')
        .then (
            function(response){
                if(response.status !== 200){ // Fetch error
                    console.log("Fetch error: " + response.status);
                    return;
                }

                response.json()
                    .then(function (data) {
                        // Add all courses to the database if the course
                        // has a reading list available
                        for (let i = 0; i < data.emne.length; i++) {
                            if (data.emne[i].status_pensum_finnes === 'J'){
                                database.push(data.emne[i])
                            }
                        }
                        result = Array.from(database);

                        // Switch ',' with '.'
                        let comma = /[0-9],[0-9]/;
                        for(let i = 0; i < result.length; i++) {
                            if(result[i].studiepoeng.match(comma)){
                                result[i].studiepoeng = result[i].studiepoeng.replace(',','.');
                            }
                        }

                        // Add unique student points to an array
                        for(let i = 0; i < result.length; i++){
                            if(!studP.includes(result[i].studiepoeng)){
                                studP.push(result[i].studiepoeng);
                            }
                        }
                        // Sort from low to high on student points
                        studP = studP.sort(function(a,b){
                            return a - b;
                        });

                        // Create array with all unique faculties
                        for(let i = 0; i < result.length; i++){
                            if(!faculties.includes(result[i].faknavn_bokmal)){
                                faculties.push(result[i].faknavn_bokmal);
                            }
                        }

                        // Onchange function to filter by faculty name
                        let selectFaculty = document.getElementById('facultyList');
                        selectFaculty.onchange = function () {
                            query.filter.faculty = selectFaculty.value;
                            filter();
                        };
                        // Add faculties to select/option element
                        for(let i = 0; i < faculties.length; i++){
                            let option = document.createElement('option');
                            option.innerHTML = faculties[i];
                            selectFaculty.appendChild(option);
                        }

                        // Onchange function for filtering by student points
                        let selectStudP = document.getElementById('studentPointList');
                        selectStudP.onchange = function(){
                            query.filter.points = selectStudP.value.toLowerCase();
                            filter();
                        };
                        // Add studentpoints from database to select/option element
                        for(let i = 0; i < studP.length; i++){
                            let option = document.createElement('option');
                            option.innerHTML = studP[i];
                            selectStudP.appendChild(option);
                        }

                        // Onkeyup function to filter by course name or course code
                        let courseName = document.getElementById('courseSearch');
                        courseName.onkeyup = function(){
                            query.filter.name = courseName.value;
                            filter();
                        };
                        
                        // Onchange for sorting the list by given values
                        let sortList = document.getElementById('sortList');
                        sortList.onchange = function(){
                            let sortValues = sortList.value.split(" ");
                            query.sort.value = sortValues[0];
                            query.sort.order = sortValues[1];
                            filter();
                        };
                        loadTable();
                    })
            }
        )
}

window.onload = setup;

function setup(){
    fetchData();
}

function filter(){
    resetResult();
    // Filtering options
    for (const option in query['filter']) {
        let current = query['filter'][option]
        if (current !== 'alle') { // Check if any filtering is chosen
            result = result.filter(val => {
                for (const values in val) {
                    // For filtering by course name/code as one types it in
                    if (val.emnenavn_bokmal.toLowerCase().includes(current.toLowerCase())){
                        return val
                    }
                    // if either values match with the current query object
                    if (val[values] === current) {
                        return val
                    }
                }
            })
        }
    }
    // Sorting options
    if(query.sort.value !== "none" && query.sort.order !== "none"){
        // Normal sorting if by studiepoeng
        if(query.sort.value === "studiepoeng"){
            if(query.sort.order === "asc") {
                result = result.sort(function (a, b) {
                    return a.studiepoeng - b.studiepoeng;
                })
            } else {
                result = result.sort(function(a,b){
                    return b.studiepoeng - a.studiepoeng;
                })
            }
        } else {
            // Sorting if either by emnenavn or emnekode
            result = result.sort(function (a,b) {
                let valueA = a[query.sort.value].toLowerCase();
                let valueB = b[query.sort.value].toLowerCase();
                if(query.sort.order === "asc"){
                    return returnValue("asc", valueA, valueB);
                } else {
                    return returnValue("desc", valueA, valueB);
                }
            })
        }
    }
    loadTable();
}

// Compares two strings and returns a number
function returnValue(order, a, b){
    if(order === "asc"){
        return a < b ? -1 : 1
    } else {
        return b < a ? -1 : 1
    }
}

function loadTable(){
    // column-headers to be presented on the website
    let col = [
        'EMNEKODE',
        'SP',
        'EMNENAVN',
        'LINK'
    ];

    // Array to be used against the database-array
    let replace = [
        'emnekode',
        'studiepoeng',
        'emnenavn_bokmal',
        'url'
    ];

    // Creates a table element
    let table = document.createElement("table");
    // Inserts a row
    let tr = table.insertRow(-1);

    // Generates the column-headers
    for(let i = 0; i < col.length; i++){
        let th = document.createElement("th");
        th.style = "position: sticky; top:0; background: #f5f5f5; padding:1em;";
        th.innerHTML = col[i];
        tr.appendChild(th);
    }

    // Insert all courses from result array to the table
    for(let i = 0; result.length > i; i++){
        if(result[i].status_pensum_finnes === 'J'){
            col = replace;
            tr = table.insertRow(-1);

            for(let j = 0; j < col.length; j++){
                let tabCell = tr.insertCell(-1);
                if (col[j] === 'url') { // Create a link for each url in database
                    let a = document.createElement('a');
                    a.href = result[i].url;
                    a.target = '_blank';
                    a.innerHTML = 'Litteraturliste for ' + result[i].emnekode;
                    tabCell.appendChild(a)
                } else {
                    tabCell.innerHTML = result[i][col[j]];
                }
            }
        }
    }

    // Insert the table in the HTML
    let container = document.getElementById("tableContainer");
    container.innerHTML = "";
    container.appendChild(table);
}

window.onscroll = function() {scrollFunction()};

// Scroll function which will show a button 
// that can take you to the top of the page
function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("topButton").style.display = "block";
    } else {
        document.getElementById("topButton").style.display = "none";
    }
}

// Scrolls to the top of the page
function toTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}