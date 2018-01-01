console.log("Server is starting...");

var express = require("express");
var app = express();

var mysql = require("mysql");
var connection = mysql.createConnection({
    host: "faoiltiarna.ddns.net",
    user: "user",
    password: "PeterRendl69!",
    database: "gamedata"
});

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

server = app.listen(3000, function() {
    console.log("listening...");
});

app.use(express.static("website"));

app.get("/highscores/:game?", sendHighscores);
app.get("/search/:player", searchPlayer);
app.get("/scores/:count?/:game?", sendScores);

app.get("/addscore/:token/:player/:score/:game", addScore);

function sendHighscores(request, response)
{
    var data = request.params;
    var resp = "Highscores: <br>";
    var game;

    if(!data.game)
    {
        game = "spacegame";
    }
    else
    {
        game = data.game;
    }

    connection.query("SELECT MAX(score) AS highscore, p.name, s.date FROM players p, games g, scores s WHERE g.name = \"" + game + "\" AND s.game_id = g.id AND s.player_id = p.id GROUP BY p.name ORDER BY highscore desc;",
        function(err, res, fields) {

        response.send(res);
    });
}

function searchPlayer(request, response)
{
    var data = request.params;
    var resp = "<style>p { font-size: 20px; } \n h1 { font-size=40px;, color=red; }</style>";
    resp += "<b><h1>Search results for " + data.player + "</h1></b><p>";

    connection.query("SELECT p.name, score, s.date FROM scores s, players p, games g WHERE s.player_id = p.id and s.game_id = 1 and s.game_id = g.id and p.name = \"" + data.player + "\" ORDER BY date DESC;",
        function(err, res, fields) {

            for(var i = 0; i < res.length; i++)
            {
                resp += ("Score: " + res[i].score + ", Date: " + res[i].date + "<br>");
            }

            resp += "</p>";
            response.send(resp);
    });
}

function sendScores(request, response)
{
    var data = request.params;
    var limit = 10;
    var game = "spacegame";

    if(data.game)
    {
        game = data.game;
    }

    if(data.count)
    {
        limit = data.count;
    }

    connection.query("SELECT p.name, s.score, s.date FROM players p, games g, scores s WHERE g.name = \"" + game +"\" AND s.game_id = g.id AND s.player_id = p.id ORDER BY score DESC LIMIT " + limit + ";",
        function(err, resp, fields) {
            response.send(resp);
        });
}

function addScore(request, response)
{
    var data = request.params;

    var token = data.token;
    var player = data.player;
    var score = data.score;
    var game = data.game;

    if(token !== "filavandrel")
    {
        response.send("invalid token.");
        return;
    }


    connection.query("SELECT id FROM players WHERE name = \"" + player + "\";",
        function(err, resp, fields) {
            if(!resp.id)
            {
                connection.query("INSERT INTO players (name, regdate) VALUES (\"" + player + "\", now());",
                    function(err, res) {
                        var playerid = res.insertId;

                        connection.query("SELECT id FROM games WHERE name = \"" + game + "\";",
                            function(err, resp, fields) {
                                if(resp)
                                {
                                    var gameid = resp[0].id;

                                    connection.query("INSERT INTO scores (score, player_id, game_id, date) VALUES (?, ?, ?, now());", [score, playerid, gameid],
                                        function(err, resp) {
                                            response.send(err);
                                        })
                                }

                            });


                    });
            }
            else
            {
                var playerid = resp[0].id;

                connection.query("SELECT id FROM games WHERE name = \"" + game + "\";",
                    function(err, resp, fields) {
                        if(resp.id)
                        {
                            var gameid = resp.id;

                            connection.query("INSERT INTO scores (score, player_id, game_id, date) VALUES (?, ?, ?, now());", [score, playerid, gameid],
                                function(err, resp) {
                                    if(!err)
                                    {
                                        response.send("Inserted score.")
                                    }
                                })
                        }

                    });
            }

        });
}
