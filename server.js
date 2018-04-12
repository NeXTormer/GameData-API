console.log("Server is starting...");

var mysql = require("mysql");
var express = require("express");
var cors = require("cors");
var fs = require("fs");

var app = express();
app.use(cors());

var connection;
var api_token;

var port = 3001;

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

app.get("/highscores/:game?", sendHighscores);

app.get("/search/:player/:game", searchPlayer);
app.get("/scores/:count/:game", sendScores);
app.get("/player/:name/:game", sendPlayerInfo);
app.get("/", sendIndex);
app.get("/addscore/:token/:player/:score/:game", addScore);

app.use(express.static("website"));

function sendIndex(request, response)
{
    response.sendfile("website/redirect.html");
}

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
        query = "select a.score as Highscore, p.name as Name, a.date as Date from scores a, players p, games g " +
            "where a.score = (select min(score) from scores b, games g2 " +
            "where b.player_id = a.player_id " +
            "and b.game_id = g.id " +
            "and g.name = \"anyway\") " +
            "and a.player_id = p.id " +
            "and a.game_id = g.id " +
            "and g.name = \"anyway\"" +
            "order by a.score asc;"
    }
    else
    {
        query = "select a.score as Highscore, p.name as Name, a.date as Date from scores a, players p, games g " +
            "where a.score = (select max(score) from scores b, games g2 " +
            "where b.player_id = a.player_id " +
            "and b.game_id = g.id " +
            "and g.name = \"spacegame\") " +
            "and a.player_id = p.id " +
            "and a.game_id = g.id " +
            "and g.name = \"spacegame\"" +
            "order by a.score desc;";
    }
    connection.query(query,
        function(err, res, fields) {
            for(var i = 0; i < res.length; i++)
            {
                res[i].Date = formatDate(res[i].Date);
                if(game.toLowerCase().charAt(0) === "a") {
                    res[i].Highscore = formatTime(res[i].Highscore);
                }
            }
            response.send(res);
    });
}

function searchPlayer(request, response)
{
    var data = request.params;

    data.player = mysql.escape(data.player);

    var query = "SELECT score as Score, p.name as Name, s.date as Date FROM scores s, players p, games g WHERE s.player_id = p.id and s.game_id = g.id AND g.name = \"" + data.game+ "\" AND p.name = " + data.player + " ORDER BY date DESC;";
    //console.log(query);
    connection.query(query,
        function(err, res, fields) {
            for(var i = 0; i < res.length; i++) {
                res[i].Date = formatDate(res[i].Date);
                if (data.game.toLowerCase().charAt(0) === "a") {
                    res[i].Score = formatTime(res[i].Score);
                }
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
        game = mysql.escape(data.game);
    }

    if(data.count)
    {
        limit = mysql.escape(data.count);
    }
    limit = limit.replace('\'', ' ');
    limit = limit.replace('\'', ' ');

    //console.log(game);

    var query = "SELECT s.score as Score, p.name as Name, s.date as Date FROM players p, games g, scores s WHERE g.name = " + game + " AND s.game_id = g.id AND s.player_id = p.id ORDER BY score " + ((game.toLowerCase() === "'anyway'") ? "ASC" : "DESC") + " LIMIT " + limit + ";";
    connection.query(query,
        function(err, res, schub) {
        //console.log(query);
            for(var i = 0; i < res.length; i++)
            {
                res[i].Date = formatDate(res[i].Date);

                //Format Score
                if(game.toLowerCase().charAt(0) === "a")
                {
                    res[i].Score = formatTime(res[i].Score);
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
    token = escapeHTML(token);
    player = escapeHTML(player);
    score = escapeHTML(score);
    game = escapeHTML(game);

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
                            var query2 = "INSERT INTO scores (score, player_id, game_id, date) VALUES (?, ?, ?, now());";
                            connection.query(query2, [score, t_id, g_id],
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
    var player = mysql.escape(data.name);


    var query;
    if(data.game.toLowerCase().charAt(0) === "a")
    {
        query = "SELECT p.name as name, p.regdate AS date, min(s.score) AS highscore FROM players p, scores s, games g WHERE s.player_id = p.id AND s.game_id = g.id AND g.name = \"anyway\" AND p.name = " + player + " LIMIT 1;";
    }
    else
    {
        query = "SELECT p.name AS name, p.regdate AS date, max(s.score) AS highscore FROM players p, scores s, games g WHERE s.player_id = p.id AND s.game_id = g.id AND g.name = \"spacegame\" AND p.name = " + player + " LIMIT 1;";
    }

    connection.query(query, function(error, res, fields) {
        res[0].date = formatDate(res[0].date);

        if(data.game.toLowerCase().charAt(0) === "a")
        {
            res[0].highscore = formatTime(res[0].highscore);
        }

        var apiresponse = {
            name: res[0].name,
            date: res[0].date,
            highscore: res[0].highscore
        };
        response.send(apiresponse);
    });

}

//Formats the MySQL Date to the format HH:MM:SS, MMM DD YYYY
function formatDate(old)
{
    var datestring = (old + "");
    var splitdate = datestring.split(" ");
    var formatted;
    if(!splitdate[1])
    {
        formatted = " ";
    }
    else
    {
        formatted = splitdate[4] + ", " + splitdate[1] + " " + splitdate[2] + " " + splitdate[3];
    }
    return formatted;
}

function formatTime(old)
{
    var minutes = Math.floor(old/ 60);
    var seconds = Math.floor((old % 60));
    var cs = ((old % 1) * 100);

    cs = Math.round(cs);
    if(minutes < 10)
    {
        minutes = "0" + minutes.toString();
    }
    if(seconds < 10)
    {
        seconds = "0" + seconds.toString();
    }
    if(cs < 10)
    {
        cs = "0" + cs.toString();
    }
    return minutes + ":" + seconds + "." + cs;
}

function escapeHTML(s) {
    return s.replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
