var express = require("express");
var app = express();
var port = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var database = require('./config/database');
var Posts = require('./models/posts');
var Util = require('./utils/utils');
var postRoutes = require('./routes/posts');
var commentsVotes = require('./routes/comments_votes');
var searchRoutes = require('./routes/search');
var accountRoutes = require('./routes/accounts');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

mongoose.connect(database);

mongoose.connection.on('connected', function () {

    console.log('Mongoose default connection open to ' + database);

    // New Posts Endpoint
    app.get("/posts/new", postRoutes.get_new);

    // Trending Posts Endpoint
    app.get("/posts/trending", postRoutes.get_trending);

    // Trending Posts Endpoint
    app.get("/posts/hot", postRoutes.get_hot);

    // Endpoint to get post comments
    app.get("/posts/:url/comments", commentsVotes.get_comments);

    // Endpoint to get post votes
    app.get("/posts/:url/votes", commentsVotes.get_votes);

    // Endpoint to get post search
    app.get("/posts/search", searchRoutes.search_text);

    // Endpoint to get post tag search
    app.get("/tags/search", searchRoutes.search_tags);

    // Endpoint to search for users
    app.get("/users/search", searchRoutes.search_users);

    // Endpoint to search user info
    app.get("/users/info", accountRoutes.get_user);

    // Endpoint to get user feed
    app.get("/posts/feed", postRoutes.get_feed);

    app.get("/", (req, res) => {
        res.send("Steemia API")
    });

    app.listen(port, () => {
        console.log("Server listening on port " + port);
    });


});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});