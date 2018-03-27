var Posts = require('../models/posts');
var Util = require('../utils/utils');
var Helper = require('./helper');
var steem = require('steem');

var exports = module.exports = {};

/**
 * Helper method to get the post
 * @param {*} req 
 * @param {*} res 
 * @param {String} type 
 */
function _get_posts(req, res, type) {
    var limit = parseInt(req.query.limit);
    var start_author = req.query.start_author;
    var permlink = req.query.start_permlink;
    var username = req.query.username;

    let object = {
        "limit": limit,
        "tag": "steemia"
    }

    if (start_author !== undefined && permlink !== undefined) {
        object.start_author = start_author;
        object.start_permlink = permlink
    }

    steem.api[type](object, (err, posts) => {

        if (posts.length != 1) {
            var result = posts.map(post => {

                post.json_metadata = JSON.parse(post.json_metadata);
    
                // Check if user has voted this post.
                post["vote"] = Helper.is_post_voted(username, post);
    
                // Get body image of the post.
                var image = Helper.get_body_image(post);
    
                // Get videos of the post
                post["videos"] = Helper.get_body_video(post);
    
                post.total_payout_value["amount"] += post.pending_payout_value["amount"];
                post.author_reputation = Util.reputation(post.author_reputation);
    
                var top_likers = Helper.get_top_likers(post.active_votes);
    
                return {
                    author: post.author,
                    avatar: "https://img.busy.org/@" + post.author,
                    author_reputation: post.author_reputation,
                    title: post.title,
                    full_body: post.body,
                    url: post.url,
                    created: post.created,
                    tags: post.json_metadata.tags,
                    category: post.category,
                    children: post.children,
                    body: image,
                    vote: post.vote,
                    net_likes: post.net_votes,
                    max_accepted_payout: parseFloat(post.max_accepted_payout),
                    total_payout_reward: parseFloat(post.total_payout_value) + parseFloat(post.pending_payout_value),
                    videos: post.videos || null,
                    top_likers_avatars: top_likers
                }
            });
    
            // If pagination, remove the starting element
            if (start_author !== undefined && permlink !== undefined) {
                result.shift();
            }
    
            let offset = result[result.length - 1].url.split('/')[3];
            let offset_author = result[result.length - 1].author;
    
            res.send({
                results: result,
                offset: offset,
                offset_author: offset_author
            });
        }

        else {
            res.send({
                results: [],
                offset: null,
                offset_author: null
            })
        }
       
    });
}

/**
 * Method to retrieve new posts
 * @param {*} req 
 * @param {*} res 
 */
function get_new(req, res) {
    _get_posts(req, res, "getDiscussionsByCreated");
}

/**
 * Method to retrieve trending posts
 * @param {*} req 
 * @param {*} res 
 */
function get_trending(req, res) {
    _get_posts(req, res, "getDiscussionsByTrending");
}

/**
 * Method to retrieve hot posts
 * @param {*} req 
 * @param {*} res 
 */
function get_hot(req, res) {
    _get_posts(req, res, "getDiscussionsByHot");
}

/**
 * Method to return feed of a given user
 * @param {*} req 
 * @param {*} res 
 */
function get_feed(req, res) {
    var user = req.query.user;
    var limit = parseInt(req.query.limit);
    var start_author = req.query.start_author;
    var permlink = req.query.start_permlink;
    var skip = parseInt(req.query.skip);
    var username = req.query.username;

    let object = {
        "limit": limit,
        "tag": user
    }

    if (start_author !== undefined && permlink !== undefined) {
        object.start_author = start_author;
        object.start_permlink = permlink
    }

    steem.api.getDiscussionsByFeed(object, (err, posts) => {
        if (posts.length != 1) {
            var result = posts.map(post => {

                post.json_metadata = JSON.parse(post.json_metadata);
    
                // Check if user has voted this post.
                post["vote"] = Helper.is_post_voted(username, post);
    
                // Get body image of the post.
                var image = Helper.get_body_image(post);
    
                // Get videos of the post
                post["videos"] = Helper.get_body_video(post);
    
                post.total_payout_value["amount"] += post.pending_payout_value["amount"];
                post.author_reputation = Util.reputation(post.author_reputation);
    
                var top_likers = Helper.get_top_likers(post.active_votes);
    
                return {
                    author: post.author,
                    avatar: "https://img.busy.org/@" + post.author,
                    author_reputation: post.author_reputation,
                    title: post.title,
                    full_body: post.body,
                    url: post.url,
                    created: post.created,
                    tags: post.json_metadata.tags,
                    category: post.category,
                    children: post.children,
                    body: image,
                    vote: post.vote,
                    net_likes: post.net_votes,
                    max_accepted_payout: parseFloat(post.max_accepted_payout),
                    total_payout_reward: parseFloat(post.total_payout_value) + parseFloat(post.pending_payout_value),
                    videos: post.videos || null,
                    top_likers_avatars: top_likers
                }
            });
    
            // If pagination, remove the starting element
            if (start_author !== undefined && permlink !== undefined) {
                result.shift();
            }
    
            let offset = result[result.length - 1].url.split('/')[3];
            let offset_author = result[result.length - 1].author;
    
            res.send({
                results: result,
                offset: offset,
                offset_author: offset_author
            });
        }

        else {
            res.send({
                results: [],
                offset: null,
                offset_author: null
            })
        }
       
    });
}

exports.get_new = get_new;
exports.get_trending = get_trending;
exports.get_hot = get_hot;
exports.get_feed = get_feed;