console.log("Server is starting...");

var mysql = require("mysql");
var express = require("express");
var fs = require("fs");

var app = express();

var connection;
var auth_token;

fs.readFile("credentials.json", "utf8", function(error, data) {
    var json = JSON.parse(data);

    connection = mysql.createConnection(json[0]);
    auth_token = json[1].token;

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

server = app.listen(3000, function() {
    console.log("listening...");
});

app.use(express.static("website"));

app.get("/highscores/:game?", sendHighscores);
app.get("/search/:player/:game?", searchPlayer);
app.get("/scores/:count?/:game?", sendScores);

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
        query = "SELECT MIN(score) AS Highscore, p.name AS Name, s.date FROM players p, games g, scores s WHERE g.name = \"anyway\" AND s.game_id = g.id AND s.player_id = p.id GROUP BY p.name ORDER BY highscore ASC;";
    }
    else
    {
        query = "SELECT MAX(score) AS Highscore, p.name AS Name, s.date FROM players p, games g, scores s WHERE g.name = \"" + game + "\" AND s.game_id = g.id AND s.player_id = p.id GROUP BY p.name ORDER BY highscore DESC;";
    }

    connection.query(query,
        function(err, res, fields) {
            for(var i = 0; i < res.length; i++)
            {
                var datef1 = (res[i].date + "");
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
                res[i].date = date3;
            }

            response.send(res);
    });
}

function searchPlayer(request, response)
{
    var data = request.params;

    connection.query("SELECT score as Score, p.name as Name, s.date FROM scores s, players p, games g WHERE s.player_id = p.id and s.game_id = g.id AND g.name = \"" + data.game+ "\" AND p.name = \"" + data.player + "\" ORDER BY date DESC;",
        function(err, res, fields) {
            for(var i = 0; i < res.length; i++)
            {
                var datef1 = (res[i].date + "");
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
                res[i].date = date3;
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

    connection.query("SELECT s.score as Score, p.name as Name, s.date FROM players p, games g, scores s WHERE g.name = \"" + game +"\" AND s.game_id = g.id AND s.player_id = p.id ORDER BY score " + ((game.toLowerCase() === "anyway") ? "ASC" : "DESC") + " LIMIT " + limit + ";",
        function(err, resp, fields) {
            for(var i = 0; i < resp.length; i++)
            {
                var datef1 = (resp[i].date + "");
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
                resp[i].date = date3;
            }
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

    if(token !== auth_token)
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