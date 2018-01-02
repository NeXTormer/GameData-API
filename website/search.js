var searched = false;
var username = "";

$(function()
{
    var textfield = document.getElementById("username");
    textfield.placeholder = "Enter username...";

    window.setInterval(timer, 500);
});

$("#gameslider").change(function() {
    sessionStorage.setItem("gameslider", this.checked);
    timer();
});

function timer()
{
    if(!searched) return;

    var game = document.getElementById("gameslider").checked;
    var url = "/search/" + username + "/" + (game ? "spacegame" : "anyway");

    $.getJSON(url, function(data) {
        fillTable(data);
    });
}

function searchPlayer()
{
    var textfield = document.getElementById("username");
    searched = true;
    username = textfield.value;
    if(username === "") username = "skdjhfk";

    timer();
}

$(function () {
    $('#username').keydown(function(event) {
        if (event.keyCode === 13) {
            searchPlayer();
            return false;
        }
    });
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
