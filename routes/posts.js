var Posts = require('../models/posts');
var Util = require('../utils/utils');
var Helper = require('./helper');
var exports = module.exports = {};

/**
 * Method to retrieve new posts
 * @param {*} req 
 * @param {*} res 
 */
function get_new(req, res) {
    var limit = parseInt(req.query.limit);
    var skip = parseInt(req.query.skip);
    var username = req.query.username;
    var logged = false;

    Posts
        .find({ "json_metadata.tags": "steemia" }, {
            "abs_rshares": 1,
            "created": 1,
            "author": 1,
            "author_reputation": 1,
            "title": 1,
            "body": 1,
            "url": 1,
            "tags":1,
            "category": 1,
            "children": 1,
            "net_votes": 1,
            "max_accepted_payout": 1,
            "total_payout_value": 1,
            "pending_payout_value": 1,
            "active_votes": 1,
            "json_metadata": 1
        })
        .sort({ 'created': -1 })
        .limit(limit)
        .skip(skip)
        .exec((err, posts) => {

            var result = posts.map(post => {

                post = JSON.parse(JSON.stringify(post));

                // Check if user has voted this post.
                post["vote"] = Helper.is_post_voted(username, post);

                // Get body image of the post.
                var image = Helper.get_body_image(post);

                // Get videos of the post
                post["videos"] = Helper.get_body_video(post);

                post.total_payout_value["amount"] += post.pending_payout_value["amount"];
                post.author_reputation = Util.reputation(post.author_reputation);

                post.tags = post.tags.filter((item,index,self) => self.indexOf(item)==index);

                var top_likers = Helper.get_top_likers(post.active_votes);

                return {
                    author: post.author,
                    avatar: "https://img.busy.org/@" + post.author,
                    author_reputation: post.author_reputation,
                    title: post.title,
                    full_body: post.body,
                    url: post.url,
                    created: post.created,
                    tags: post.tags,
                    category: post.category,
                    children: post.children,
                    body: image,
                    vote: post.vote,
                    net_votes: post.net_votes,
                    max_accepted_payout: post.max_accepted_payout["amount"],
                    total_payout_reward: post.total_payout_value["amount"],
                    videos: post.videos || null,
                    top_likers_avatars: top_likers
                }
            });
            res.send({
                results: result
            });
        });
}

/**
 * Method to retrieve trending posts
 * @param {*} req 
 * @param {*} res 
 */
function get_trending(req, res, type) {
    var limit = parseInt(req.query.limit);
    var skip = parseInt(req.query.skip);
    var username = req.query.username;
    var logged = false;

    Posts
    .find({ "json_metadata.tags": "steemia"}, {
        "abs_rshares": 1,
        "created": 1,
        "author": 1,
        "author_reputation": 1,
        "title": 1,
        "body": 1,
        "url": 1,
        "tags":1,
        "category": 1,
        "children": 1,
        "net_votes": 1,
        "max_accepted_payout": 1,
        "total_payout_value": 1,
        "pending_payout_value": 1,
        "active_votes": 1,
        "json_metadata": 1
    })
    .sort({'created': -1})
    .limit(limit)
    .skip(skip)
    .exec((err, posts) => {

        // Iterate over the posts and return them with their respective scores
        var result = posts.map(post => {
            post = JSON.parse(JSON.stringify(post));
            let abs_rshares = post["abs_rshares"];
            let created = new Date(post["created"]).getTime() / 1000;
            let score = Util.caculate_trending(abs_rshares, created);
            if (isNaN(score)) score = 0;
            post["score"] = score;
            return post;
        });

        // Sort the posts by score
        var sorted = result.sort((a, b) => { 
            return b.score - a.score; 
        });

        var final = sorted.map(post => {

            post = JSON.parse(JSON.stringify(post));

            // Check if user has voted this post.
            post["vote"] = Helper.is_post_voted(username, post);

            // Get body image of the post.
            var image = Helper.get_body_image(post);

            // Get videos of the post
            post["videos"] = Helper.get_body_video(post);

            post.total_payout_value["amount"] += post.pending_payout_value["amount"];
            post.author_reputation = Util.reputation(post.author_reputation);

            post.tags = post.tags.filter((item,index,self) => self.indexOf(item)==index);

            var top_likers = Helper.get_top_likers(post.active_votes);

            return {
                author: post.author,
                avatar: "https://img.busy.org/@" + post.author,
                author_reputation: post.author_reputation,
                title: post.title,
                full_body: post.body,
                url: post.url,
                created: post.created,
                tags: post.tags,
                category: post.category,
                children: post.children,
                body: image,
                vote: post.vote,
                net_votes: post.net_votes,
                max_accepted_payout: post.max_accepted_payout["amount"],
                total_payout_reward: post.total_payout_value["amount"],
                videos: post.videos || null,
                top_likers_avatars: top_likers,
                score: post["score"]
            }
        });
        res.send({
            results: final
        });
    });
}

/**
 * Method to retrieve hot posts
 * @param {*} req 
 * @param {*} res 
 */
function get_hot(req, res, type) {
    var limit = parseInt(req.query.limit);
    var skip = parseInt(req.query.skip);
    var username = req.query.username;
    var logged = false;

    Posts
        .find({ "json_metadata.tags": "steemia"}, {
            "abs_rshares": 1,
            "created": 1,
            "author": 1,
            "author_reputation": 1,
            "title": 1,
            "body": 1,
            "url": 1,
            "tags":1,
            "category": 1,
            "children": 1,
            "net_votes": 1,
            "max_accepted_payout": 1,
            "total_payout_value": 1,
            "pending_payout_value": 1,
            "active_votes": 1,
            "json_metadata": 1
        })
        .lean()
        .sort({'created': -1})
        .limit(limit)
        .skip(skip)
        .exec((err, posts) => {

            // Iterate over the posts and return them with their respective scores
            var result = posts.map(post => {
                post = JSON.parse(JSON.stringify(post));
                let abs_rshares = post["abs_rshares"];
                let created = new Date(post["created"]).getTime() / 1000;
                let score = Util.calculate_hot(abs_rshares, created);
                if (isNaN(score)) score = 0;
                post["score"] = score;
                return post;
            });

            // Sort the posts by score
            var sorted = result.sort((a, b) => { 
                return b.score - a.score; 
            });

            var final = sorted.map(post => {

                post = JSON.parse(JSON.stringify(post));

                // Check if user has voted this post.
                post["vote"] = Helper.is_post_voted(username, post);

                // Get body image of the post.
                var image = Helper.get_body_image(post);

                // Get videos of the post
                post["videos"] = Helper.get_body_video(post);

                post.total_payout_value["amount"] += post.pending_payout_value["amount"];
                post.author_reputation = Util.reputation(post.author_reputation);

                post.tags = post.tags.filter((item,index,self) => self.indexOf(item)==index);

                var top_likers = Helper.get_top_likers(post.active_votes);

                return {
                    author: post.author,
                    avatar: "https://img.busy.org/@" + post.author,
                    author_reputation: post.author_reputation,
                    title: post.title,
                    full_body: post.body,
                    url: post.url,
                    created: post.created,
                    tags: post.tags,
                    category: post.category,
                    children: post.children,
                    body: image,
                    vote: post.vote,
                    net_votes: post.net_votes,
                    max_accepted_payout: post.max_accepted_payout["amount"],
                    total_payout_reward: post.total_payout_value["amount"],
                    videos: post.videos || null,
                    top_likers_avatars: top_likers,
                    score: post["score"]
                }
            });
            res.send({
                results: final
            });
        });
}

exports.get_new = get_new;
exports.get_trending = get_trending;
exports.get_hot = get_hot;