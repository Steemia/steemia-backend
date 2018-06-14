const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const body_parser = require('body-parser');
const POST_ROUTES = require('./routes/posts');
const SEARCH_ROUTES = require('./routes/search');
const ACCOUNTS_ROUTES = require('./routes/accounts');
const TAGS_ROUTES = require('./routes/tags');
const middleware = require('./middleware');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');

/**
 * Body parser setup
 */
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

// gzip compression
app.use(compress());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// Add headers
app.use((req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Pass to next layer of middleware
    next();
});

/**
 * Routes
 */
app.use('/posts', POST_ROUTES); // Endpoints for Post Routes
app.use('/users', ACCOUNTS_ROUTES); // Endpoints for Users Routes
app.use('/search', SEARCH_ROUTES); // Endpoints for Search Routes
app.use('/tags', TAGS_ROUTES); // Endpoints for Tags Routes

// Handle the base path
app.get('/', (req, res) => {
    res.send('Steemia API');
});

/**
 * Middlewares for errors
 */
app.use(middleware.errorHandler);
app.use(middleware.clientErrorHandler);
app.all('*', (req, res) => { throw new Error('Bad request') });
app.use((e, req, res, next) => {
    if (e.message === 'Bad request') {
        res.status(400);
        res.send({
            status: 400,
            error: 'This route does not exist on this server.',
            type: 'Internal'
        });
    }
});

app.listen(port, () => {
    console.log('Server listening on port ' + port);
});
