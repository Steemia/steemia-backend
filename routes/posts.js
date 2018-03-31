const POSTS = require('../models/posts');
const UTIL = require('../utils/utils');
const HELPER = require('./helper');
const STEEM = require('steem');

var exports = module.exports = {};

/**
 * Helper method to get the post
 * @param {*} req 
 * @param {*} res 
 * @param {String} type 
 */
function _get_posts(req, res, type, tag) {
    let limit = parseInt(req.query.limit);
    let start_author = req.query.start_author;
    let permlink = req.query.start_permlink;
    let username = req.query.username;

    let object = {
        'limit': limit,
        'tag': tag
    }

    if (start_author !== undefined && permlink !== undefined) {
        object.start_author = start_author;
        object.start_permlink = permlink
    }

    STEEM.api[type](object, (err, posts) => {

        if (posts.length != 1) {
            let result = posts.map(post => {

                post.json_metadata = JSON.parse(post.json_metadata);

                // Check if user has voted this post.
                post["vote"] = HELPER.is_post_voted(username, post);

                // Get body image of the post.
                let image = HELPER.get_body_image(post);

                // Get videos of the post
                post.videos = HELPER.get_body_video(post);

                if (post.videos !== null) {
                    if (post.videos.length == 1 && post.body.trim() == post.videos[0]) {
                        post.video_only = true;
                    }

                    else {
                        post.video_only = false;
                    }
                }

                else {
                    post.video_only = false;
                }

                post.total_payout_value.amount += post.pending_payout_value.amount;
                post.author_reputation = UTIL.reputation(post.author_reputation);

                let top_likers = HELPER.get_top_likers(post.active_votes);

                return _get_response(post, image, top_likers);
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
 * Method to prepared response object
 * @param {*} post 
 * @returns Returns an object with the response.
 */
function _get_response(post, image, top_likers) {
    return {
        author: post.author,
        avatar: `https://img.busy.org/@${post.author}`,
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
        video_only: post.video_only,
        top_likers_avatars: top_likers
    }
}

/**
 * Method to retrieve new posts
 * @param {*} req 
 * @param {*} res 
 */
function get_new(req, res) {
    _get_posts(req, res, 'getDiscussionsByCreated', 'steemia');
}

/**
 * Method to retrieve trending posts
 * @param {*} req 
 * @param {*} res 
 */
function get_trending(req, res) {
    _get_posts(req, res, 'getDiscussionsByTrending', 'steemia');
}

/**
 * Method to retrieve hot posts
 * @param {*} req 
 * @param {*} res 
 */
function get_hot(req, res) {
    _get_posts(req, res, 'getDiscussionsByHot', 'steemia');
}

function get_profile_posts(req, res) {
    let user = req.query.user;
    let limit = parseInt(req.query.limit);
    let skip = parseInt(req.query.skip);
    let username = req.query.username;

    POSTS.find(
        { author: user, 'json_metadata.tags': 'steemia' },
        {
            'abs_rshares': 1,
            'created': 1,
            'author': 1,
            'author_reputation': 1,
            'title': 1,
            'body': 1,
            'url': 1,
            'tags': 1,
            'category': 1,
            'children': 1,
            'net_votes': 1,
            'max_accepted_payout': 1,
            'total_payout_value': 1,
            'pending_payout_value': 1,
            'active_votes': 1,
            'json_metadata': 1
        }
    ).sort({ 'created': -1 }).limit(limit).skip(skip).lean().exec((err, data) => {
        
        let result = data.map(post => {

            post = JSON.parse(JSON.stringify(post));

            post.json_metadata = JSON.parse(JSON.stringify(post.json_metadata));

            // Check if user has voted this post.
            post.vote = HELPER.is_post_voted(username, post);

            // Get body image of the post.
            let image = HELPER.get_body_image(post);

            // Get videos of the post
            post.videos = HELPER.get_body_video(post);

            if (post.videos !== null) {
                if (post.videos.length == 1 && post.body.trim() == post.videos[0]) {
                    post.video_only = true;
                }

                else {
                    post.video_only = false;
                }
            }

            else {
                post.video_only = false;
            }

            post.max_accepted_payout = post.max_accepted_payout.amount;
            post.total_payout_value = post.total_payout_value.amount + post.pending_payout_value.amount;
            post.pending_payout_value = post.pending_payout_value.amount;
            post.author_reputation = UTIL.reputation(post.author_reputation);

            let top_likers = HELPER.get_top_likers(post.active_votes);

            return _get_response(post, image, top_likers);
        });

        res.send({
            results: result,
        });

    });
}

/**
 * Method to get a single post
 * @param {*} req 
 * @param {*} res 
 */
function get_post_single(req, res) {
    let username = req.query.username;
    let author = req.query.author;
    let permlink = req.query.permlink;

    STEEM.api.getContent(author, permlink, (err, post) => {

        post.json_metadata = JSON.parse(post.json_metadata);

        // Check if user has voted this post.
        post.vote = HELPER.is_post_voted(username, post);

        // Get body image of the post.
        let image = HELPER.get_body_image(post);

        // Get videos of the post
        post.videos = Helper.get_body_video(post);

        if (post.videos !== null) {
            if (post.videos.length == 1 && post.body.trim() == post.videos[0]) {
                post.video_only = true;
            }

            else {
                post.video_only = false;
            }
        }

        else {
            post.video_only = false;
        }

        post.total_payout_value.amount += post.pending_payout_value.amount;
        post.author_reputation = UTIL.reputation(post.author_reputation);

        let top_likers = HELPER.get_top_likers(post.active_votes);

        res.send(_get_response(post, image, top_likers));

    });
}

/**
 * Method to return feed of a given user
 * @param {*} req 
 * @param {*} res 
 */
function get_feed(req, res) {
    let user = req.query.user;
    let limit = parseInt(req.query.limit);
    let start_author = req.query.start_author;
    let permlink = req.query.start_permlink;
    let skip = parseInt(req.query.skip);
    let username = req.query.username;

    let object = {
        'limit': limit,
        'tag': user
    }

    if (start_author !== undefined && permlink !== undefined) {
        object.start_author = start_author;
        object.start_permlink = permlink
    }

    STEEM.api.getDiscussionsByFeed(object, (err, posts) => {
        if (posts.length != 1) {
            let result = posts.map(post => {

                post.json_metadata = JSON.parse(post.json_metadata);

                // Check if user has voted this post.
                post.vote = HELPER.is_post_voted(username, post);

                // Get body image of the post.
                let image = HELPER.get_body_image(post);

                // Get videos of the post
                post.videos = HELPER.get_body_video(post);

                if (post.videos !== null) {
                    if (post.videos.length == 1 && post.body.trim() == post.videos[0]) {
                        post.video_only = true;
                    }

                    else {
                        post.video_only = false;
                    }
                }

                else {
                    post.video_only = false;
                }

                post.total_payout_value.amount += post.pending_payout_value.amount;
                post.author_reputation = UTIL.reputation(post.author_reputation);

                let top_likers = HELPER.get_top_likers(post.active_votes);

                return _get_response(post, image, top_likers);
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
exports.get_post_single = get_post_single;
exports.get_profile_posts = get_profile_posts;