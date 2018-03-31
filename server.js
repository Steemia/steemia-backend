const EXPRESS = require('express');
const APP = EXPRESS();
const PORT = process.env.PORT || 3000;
const BODY_PARSER = require('body-parser');
const MONGOOSE = require('mongoose');
const DATABASE = require('./config/database');
const POST_ROUTES = require('./routes/posts');
const COMMENT_VOTES_ROUTES = require('./routes/comments_votes');
const SEARCH_ROUTES = require('./routes/search');
const ACCOUNTS_ROUTES = require('./routes/accounts');

APP.use(BODY_PARSER.json());
APP.use(BODY_PARSER.urlencoded({ extended: true }));

// Add headers
APP.use((req, res, next) => {

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

MONGOOSE.connect(DATABASE);

MONGOOSE.connection.on('connected', () => {

    console.log('Mongoose default connection open to ' + DATABASE);

    // New Posts Endpoint
    APP.get('/posts/new', POST_ROUTES.get_new);

    // Trending Posts Endpoint
    APP.get('/posts/trending', POST_ROUTES.get_trending);

    // Trending Posts Endpoint
    APP.get('/posts/hot', POST_ROUTES.get_hot);

    // Endpoint to get post comments
    APP.get('/posts/comments', COMMENT_VOTES_ROUTES.get_comments);

    // Endpoint to get post votes
    APP.get('/posts/votes', COMMENT_VOTES_ROUTES.get_votes);

    // Endpoint to get posts from user blog
    APP.get('/posts/blog', POST_ROUTES.get_profile_posts);

    // Endpoint to get post search
    APP.get('/posts/search', SEARCH_ROUTES.search_text);

    // Endpoint to get post tag search
    APP.get('/tags/search', SEARCH_ROUTES.search_tags);

    // Endpoint to search for users
    APP.get('/users/search', SEARCH_ROUTES.search_users);

    // Endpoint to search user info
    APP.get('/users/info', ACCOUNTS_ROUTES.get_account);

    // Endpoint to get user feed
    APP.get('/posts/feed', POST_ROUTES.get_feed);

    // Endpoint to get post single
    APP.get('/posts/info', POST_ROUTES.get_post_single);

    // Handle the base path
    APP.get('/', (req, res) => {
        res.send('Steemia API');
    });

    APP.listen(PORT, () => {
        console.log('Server listening on port ' + PORT);
    });

});

// If the connection throws an error
MONGOOSE.connection.on('error', (err) => {
    // New Posts Endpoint
    APP.get('/posts/new', POST_ROUTES.get_new);

    // Trending Posts Endpoint
    APP.get('/posts/trending', POST_ROUTES.get_trending);

    // Trending Posts Endpoint
    APP.get('/posts/hot', POST_ROUTES.get_hot);

    // Endpoint to get post comments
    APP.get('/posts/comments', COMMENT_VOTES_ROUTES.get_comments);

    // Endpoint to get post votes
    APP.get('/posts/votes', COMMENT_VOTES_ROUTES.get_votes);

    // Endpoint to get posts from user blog
    APP.get('/posts/blog', POST_ROUTES.get_profile_posts);

    // Endpoint to get post search
    APP.get('/posts/search', SEARCH_ROUTES.search_text);

    // Endpoint to get post tag search
    APP.get('/tags/search', SEARCH_ROUTES.search_tags);

    // Endpoint to search for users
    APP.get('/users/search', SEARCH_ROUTES.search_users);

    // Endpoint to search user info
    APP.get('/users/info', ACCOUNTS_ROUTES.get_account);

    // Endpoint to get user feed
    APP.get('/posts/feed', POST_ROUTES.get_feed);

    // Endpoint to get post single
    APP.get('/posts/info', POST_ROUTES.get_post_single);

    // Handle the base path
    APP.get('/', (req, res) => {
        res.send('Steemia API');
    });

    APP.listen(PORT, () => {
        console.log('Server listening on port ' + PORT);
    });
});

// When the connection is disconnected
MONGOOSE.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected');
});