console.log("Server is starting...");

var mysql = require("mysql");
var express = require("express");
var fs = require("fs");

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

app.get("/highscores/:game?", sendHighscores);
app.get("/search/:player/:game?", searchPlayer);
app.get("/scores/:count?/:game?", sendScores);
app.get("/player/:name/:game", sendPlayerInfo);

app.get("/addscore/:token/:player/:score/:game", addScore);

function sendHighscores(request, response)
{
    var data = request.params;
    var game;

    if(!data.game)
    {
        game = "spacegame";
    }
    else
    {
        game = data.game;
    }

    var query;
    if(game.toLowerCase().charAt(0) === "a")
    {
        query = "SELECT MIN(score) AS Highscore, p.name AS Name, s.date as Date FROM players p, games g, scores s WHERE g.name = \"anyway\" AND s.game_id = g.id AND s.player_id = p.id GROUP BY p.name ORDER BY highscore ASC;";
    }
    else
    {
        query = "SELECT MAX(score) AS Highscore, p.name AS Name, s.date as Date FROM players p, games g, scores s WHERE g.name = \"" + game + "\" AND s.game_id = g.id AND s.player_id = p.id GROUP BY p.name ORDER BY highscore DESC;";
    }

    connection.query(query,
        function(err, res, fields) {
            for(var i = 0; i < res.length; i++)
            {
                //Format Date
                var datef1 = (res[i].Date + "");
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

                //Format Score
                if(game.toLowerCase().charAt(0) === "a")
                {
                    var scoren = res[i].Highscore;

                    var minutes = Math.floor(scoren / 60);
                    var seconds = (scoren % 60).toFixed(0);
                    var ms = ((scoren % 1) * 100);

                    res[i].Highscore = minutes + ":" + seconds + "." + ms.toFixed(0);
                }

                res[i].Date = date3;
            }
            response.send(res);
    });
}

function searchPlayer(request, response)
{
    var data = request.params;

    connection.query("SELECT score as Score, p.name as Name, s.date as Date FROM scores s, players p, games g WHERE s.player_id = p.id and s.game_id = g.id AND g.name = \"" + data.game+ "\" AND p.name = \"" + data.player + "\" ORDER BY date DESC;",
        function(err, res, fields) {
            for(var i = 0; i < res.length; i++)
            {
                //Format Date
                var datef1 = (res[i].Date + "");
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

                //Format Score
                if(data.game.toLowerCase().charAt(0) === "a")
                {
                    var scoren = res[i].Score;

                    var minutes = Math.floor(scoren / 60);
                    var seconds = (scoren % 60).toFixed(0);
                    var ms = ((scoren % 1) * 100);

                    res[i].Score = minutes + ":" + seconds + "." + ms.toFixed(0);
                }
                res[i].Date = date3;
            }
            response.send(res);
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

    connection.query("SELECT s.score as Score, p.name as Name, s.date as Date FROM players p, games g, scores s WHERE g.name = \"" + game +"\" AND s.game_id = g.id AND s.player_id = p.id ORDER BY score " + ((game.toLowerCase() === "anyway") ? "ASC" : "DESC") + " LIMIT " + limit + ";",
        function(err, res, fields) {
            for(var i = 0; i < res.length; i++)
            {
                //Format Date
                var datef1 = (res[i].Date + "");
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
                res[i].Date = date3;

                //Format Score
                if(game.toLowerCase().charAt(0) === "a")
                {
                    var scoren = res[i].Score;

                    var minutes = Math.floor(scoren / 60);
                    var seconds = (scoren % 60).toFixed(0);
                    var ms = ((scoren % 1) * 100);

                    res[i].Score = minutes + ":" + seconds + "." + ms.toFixed(0);
                }
            }
            response.send(res);
        });
}

function addScore(request, response)
{
    var data = request.params;

    var token = data.token;
    var player = data.player;
    var score = data.score;
    var game = data.game;

    if(token !== api_token)
    {
        response.send("invalid token.");
        return;
    }

    var query = "SELECT id FROM players WHERE name = \"" + player + "\";";
    connection.query(query,
        function(err, resp, fields) {
            var t_id;
            if(resp instanceof Array)
            {
                try
                {
                    t_id = resp[0].id;
                }
                catch(e)
                {
                    t_id = -1;
                }
            }
            else
            {
                try
                {
                    t_id = resp.id;
                }
                catch(e)
                {
                    t_id = -1;
                }
            }

            if(t_id === -1)
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
                                            var message = "Created new player [ " + playerid + ", " + player + " ] and inserted the score [ " + score + " ] for the game [ " + gameid + ", " + game + " ].";
                                            console.log(message);
                                            response.send({
                                                msg: message
                                            });
                                        });
                                }
                            });
                    });
            }
            else
            {
                console.log(t_id);
                var e_query = "SELECT id FROM games WHERE name = \"" + game + "\";";
                connection.query(e_query,
                    function(err, resp, fields) {
                        var g_id;
                        if(resp instanceof Array)
                        {
                            try
                            {
                                g_id = resp[0].id;
                            }
                            catch(e)
                            {
                                g_id = -1;
                            }
                        }
                        else
                        {
                            try
                            {
                                g_id = resp.id;
                            }
                            catch(e)
                            {
                                g_id = -1;
                            }
                        }

                        if(g_id !== -1)
                        {
                            var query2 = "INSERT INTO scores (score, player_id, game_id, date) VALUES (\"" + score + "\", \"" + t_id + "\", \"" + g_id + "\", now());";
                            connection.query(query2,
                                function(err, resp) {
                                    var message = "requested existing player [ " + t_id + ", " + player + " ] and inserted the score [ " + score + " ] for the game [ " + g_id + ", " + game + " ]."
                                    console.log(message);
                                    response.send({msg: message});
                                });
                        }
                        else
                        {
                            message = "could not find game " + game;
                            console.log(message);
                            response.send({msg: message});
                        }

                    });
            }
        });
}

function sendPlayerInfo(request, response)
{
    var data = request.params;
    var player = data.name;


    var query;
    if(data.game.toLowerCase().charAt(0) === "a")
    {
        query = "SELECT p.name as name, p.regdate AS date, min(s.score) AS highscore FROM players p, scores s, games g WHERE s.player_id = p.id AND s.game_id = g.id AND g.name = \"anyway\" AND p.name = \"" + player + "\" LIMIT 1;";
    }
    else
    {
        query = "SELECT p.name AS name, p.regdate AS date, max(s.score) AS highscore FROM players p, scores s, games g WHERE s.player_id = p.id AND s.game_id = g.id AND g.name = \"spacegame\" AND p.name = \"" + player + "\" LIMIT 1;";
    }

    connection.query(query, function(error, res, fields) {
        //format date
        var datef1 = (res[0].date + "");
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
        res[0].date = date3;

        //format score
        if(data.game.toLowerCase().charAt(0) === "a")
        {
            var scoren = res[0].highscore;

            var minutes = Math.floor(scoren / 60);
            var seconds = (scoren % 60).toFixed(0);
            var ms = ((scoren % 1) * 100);

            res[0].highscore = minutes + ":" + seconds + "." + ms.toFixed(0);
        }

        var apiresponse = {
            name: res[0].name,
            date: res[0].date,
            highscore: res[0].highscore
        };
        response.send(apiresponse);
    });

}
