var express = require("express");
var app = express();
var port = 3000;
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var database = require('./config/database');
var Posts = require('./models/posts');
var Util = require('./utils/utils');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(database);

mongoose.connection.on('connected', function () {

    console.log('Mongoose default connection open to ' + database);

    app.get("/posts", (req, res) => {
        Posts
        .find({ "json_metadata.tags": "steemia" })
        .sort({'created': -1})
        .limit(25)
        .exec((err, posts) => {
            res.send(posts)
        })
    });

    app.get("/posts/trending", (req, res) => {

        let date = Util.seven_days_ago();
        Posts
        .find({ "json_metadata.tags": "steemia"})
        .sort({'created': -1})
        .limit(25)
        .exec((err, posts) => {
            var result = posts.map(post => {
                post = JSON.parse(JSON.stringify(post));
                let abs_rshares = post["abs_rshares"];
                let created = new Date(post["created"]).getTime() / 1000;
                let score = Util.caculate_trending(abs_rshares, created);
                if (isNaN(score)) score = 0;
                post["score"] = score;
                return post;
            });
            var sorted = result.sort( function ( a, b ) { 
                return b.score - a.score; 
            } )
            res.send(sorted);
        });

        
    })
    
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

//console.log(Util.caculate_trending(40460939026, 1521850746));
// console.log(Util.caculate_trending(5772445047028, 1521755652));
// console.log(Util.caculate_trending(6745757389142, 1521456096));
// console.log(Util.caculate_trending(377440290440, 1521822885));




