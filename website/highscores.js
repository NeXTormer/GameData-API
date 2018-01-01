
var testdata = [
    {
        name: "DefaultUser",
        score: 33605,
        date: null
    },
    {
        name: "GameZter",
        score: 33175,
        date: null
    },
    {
        name: "GameZter",
        score: 32568,
        date: "2017-12-29T10:06:48.000Z"
    },
    {
        name: "GameZter",
        score: 30706,
        date: "2017-12-28T23:21:48.000Z"
    },
    {
        name: "GameZter",
        score: 25532,
        date: "2017-12-28T23:00:54.000Z"
    },
    {
        name: "GameZter",
        score: 23528,
        date: "2017-12-28T23:18:25.000Z"
    },
    {
        name: "GameZter",
        score: 19220,
        date: null
    },
    {
        name: "GameZter",
        score: 19138,
        date: "2017-12-28T22:42:21.000Z"
    },
    {
        name: "GameZter",
        score: 16720,
        date: "2017-12-28T21:32:44.000Z"
    },
    {
        name: "GameZter",
        score: 16089,
        date: null
    }
];

$.getJSON("/scores/100000", function(data) {
    fillTable(data);
});


function fillTable(data)
{

    // get headers
    var col = [];
    for (var i = 0; i < data.length; i++) {
        for (var key in data[i]) {
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    }

    // create html table
    var table = document.createElement("table");

    // create and add data to header
    var tr = table.insertRow(-1);
    for (var i = 0; i < col.length; i++) {
        var th = document.createElement("th");
        th.innerHTML = col[i];
        tr.appendChild(th);
    }

    // create and add data to other rows
    for (var i = 0; i < data.length; i++) {

        tr = table.insertRow(-1);

        for (var j = 0; j < col.length; j++) {
            var tabCell = tr.insertCell(-1);
            tabCell.innerHTML = data[i][col[j]];
        }
    }

    // insert table into div
    var divContainer = document.getElementById("insertTable");
    divContainer.innerHTML = "";
    divContainer.appendChild(table);
}