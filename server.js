console.log("Server is starting...");

var express = require("express");
var app = express();

server = app.listen(3000, function() {
    console.log("listening...");
});

app.use(express.static("website"));
