console.log("Server is starting...");

var mysql = require("mysql");
var express = require("express");
var fs = require("fs");

var SerialPort = require("serialport");

var port = new SerialPort("COM10", {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1
});


port.on("open", function() {
    console.log('Serial Port Opend');



});

port.on("data", function(schub) {
    var voltage = schub[0] * (5 / 255);

    console.log(voltage);
    var query = "INSERT INTO messwerte.values (time, poti) values (now(), " + voltage + ");";
    connection.query(query, function(err, wer) { });

});


var app = express();

var connection;
var api_token;

var port = 3000;

fs.readFile("credentials.json", "utf8", function(error, data) {
    var json = JSON.parse(data);

    connection = mysql.createConnection(json[0]);
    api_token = json[1].token;

    connection.connect(function(error) {
        if(error == null)
        {
            console.log("Sucessfully connected to MySQL server with id " + connection.threadId + ".")
        }
        else
        {
            console.log(error);
        }
    });
});

server = app.listen(port, function() {
    console.log("listening on port " + port);
});

app.use(express.static("website"));

app.get("/get/", sendValues);

function sendValues(request, response)
{
    var query = "SELECT id as ID, time as Time, poti as Potentiometerwert, ldr as Lichtwert FROM messwerte.values ORDER BY time DESC;";

    connection.query(query, function(error, res, fields) {

        for(var i = 0; i < res.length; i++)
        {
            //format date
            var datef1 = (res[i].Time + "");
            var date2 = datef1.split(" ");
            var date3;
            if(!date2[1])
            {
                date3 = " ";
            }
            else
            {
                date3 = date2[4] + ", " + date2[1] + " " + date2[2] + " " + date2[3];
            }
            res[i].Time = date3;
        }

        response.send(res);
    });

}