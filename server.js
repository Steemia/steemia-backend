const EXPRESS = require('express');
const APP = EXPRESS();
const PORT = process.env.PORT || 3000;
const BODY_PARSER = require('body-parser');
const POST_ROUTES = require('./routes/posts');
const SEARCH_ROUTES = require('./routes/search');
const ACCOUNTS_ROUTES = require('./routes/accounts');
const MIDDLEWARE = require('./middleware');

/**
 * Body parser setup
 */
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

/**
 * Routes
 */
APP.use('/posts', POST_ROUTES); // Endpoints for Post Routes
APP.use('/users', ACCOUNTS_ROUTES); // Endpoints for Users Routes
APP.use('/search', SEARCH_ROUTES); // Endpoints for Search Routes

// Handle the base path
APP.get('/', (req, res) => {
    res.send('Steemia API');
});

/**
 * Middlewares for errors
 */
APP.use(MIDDLEWARE.errorHandler);
APP.use(MIDDLEWARE.clientErrorHandler);
APP.all('*', (req, res) => { throw new Error('Bad request') });
APP.use((e, req, res, next) => {
    if (e.message === 'Bad request') {
        res.status(400);
        res.send({
            status: 400,
            error: 'This route does not exist on this server.',
            type: 'Internal'
        });
    }
});

APP.listen(PORT, () => {
    console.log('Server listening on port ' + PORT);
});
