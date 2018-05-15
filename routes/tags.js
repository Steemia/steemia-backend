var client = require('../utils/steemAPI');
var express = require('express');
var router = express.Router();

router.get('/all', (req, res, next) => {
    client.sendAsync('get_trending_tags', ['', 1000]).then((tags) => {
        tags = tags.slice(1);
        res.send({
            results: tags
        });
    });
});

module.exports = router;