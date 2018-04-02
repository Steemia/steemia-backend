const UTIL = require('../utils/utils');
const HELPER = require('./helper');
const STEEM = require('steem');
const MARKDOWN = require('remarkable');
var md = new MARKDOWN('full', {
    html: true,
    linkify: true,
    breaks: false,
    typographer: true,
});
var express = require('express');
var router = express.Router();

/**
 * Helper method to get the post
 * @param {*} req 
 * @param {*} res 
 * @param {String} type 
 */
function _get_posts(req, res, next, type, tag) {
    let limit = parseInt(req.query.limit);
    let start_author = req.query.start_author;
    let start_permlink = req.query.start_permlink;
    let username = req.query.username;

    if (Number.isNaN(limit)) {
        return next(HELPER._prepare_error(500, 'Required parameter "limit" is missing.', 'Internal'));
    }

    let object = {
        'limit': limit,
        'tag': tag
    }

    if (start_author !== undefined && start_permlink !== undefined) {
        object.start_author = start_author;
        object.start_permlink = start_permlink;
    }

    STEEM.api[type](object, (err, posts) => {

        try {
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
                    
                    try {
                        post.nsfw = post.json_metadata.tags.includes('nsfw');
                    }

                    catch(e) {
                        post.nsfw = false;
                    }
                    
                    let top_likers = HELPER.get_top_likers(post.active_votes);

                    if (post.reblogged_by.length > 0) {
                        post.reblogged_by = post.reblogged_by[0];
                    }

                    else {
                        post.reblogged_by = null;
                    }
    
                    post.body = HELPER.parse_body(post.body);
    
                    return _get_response(post, image, top_likers);
                });
    
                // If pagination, remove the starting element
                if (start_author !== undefined && start_permlink !== undefined) {
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
                });
            }
        }
        catch(e) {
            console.log(e)
            res.send({
                results: [],
                offset: null,
                offset_author: null
            });
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
        reblogged_by: post.reblogged_by,
        author_reputation: post.author_reputation,
        title: post.title,
        full_body: md.render(post.body),
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
        is_nsfw: post.nsfw,
        video_only: post.video_only,
        top_likers_avatars: top_likers
    };
}

/**
 * Method to retrieve new posts
 */
router.get('/new', (req, res, next) => {
    _get_posts(req, res, next, 'getDiscussionsByCreated', '');
});

/**
 * Method to retrieve trending posts
 */
router.get('/trending', (req, res, next) => {
    _get_posts(req, res, next, 'getDiscussionsByTrending', '');
});

/**
 * Method to retrieve hot posts
 */
router.get('/hot', (req, res, next) => {
    _get_posts(req, res, next, 'getDiscussionsByHot', '');
});

/**
 * Method to get blog from a specific user
 */
router.get('/blog', (req, res, next) => {
    let user = req.query.user;
    _get_posts(req, res, next, 'getDiscussionsByBlog', user);
});

/**
 * Method to get a single post
 * @param {*} req 
 * @param {*} res 
 */

router.get('/info', (req, res, next) => {

    let username = req.query.username;
    let author = req.query.author;
    let permlink = req.query.permlink;

    if (author === null || author === undefined || author === '') {
        if (permlink === null || permlink === undefined || permlink === '') {
            return next(HELPER._prepare_error(500, 'Required parameters "author" and "permlink" are missing.', 'Internal'));
        }
        return next(HELPER._prepare_error(500, 'Required parameter "author" is missing.', 'Internal'));
    }

    else {
        if (permlink === null || permlink === undefined || permlink === '') {
            return next(HELPER._prepare_error(500, 'Required parameter "permlink" is missing.', 'Internal'));
        }
    }

    STEEM.api.getContent(author, permlink, (err, post) => {

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

        if (post.reblogged_by.length > 0) {
            post.reblogged_by = post.reblogged_by[0];
        }

        else {
            post.reblogged_by = null;
        }

        try {
            post.nsfw = post.json_metadata.tags.includes('nsfw');
        }

        catch(e) {
            post.nsfw = false;
        }

        post.body = HELPER.parse_body(post.body);

        res.send(_get_response(post, image, top_likers));

    });
});

/**
 * Method to return feed of a given user
 * @param {*} req 
 * @param {*} res 
 */

router.get('/feed', (req, res, next) => {
    let user = req.query.user;
    let limit = parseInt(req.query.limit);
    let start_author = req.query.start_author;
    let start_permlink = req.query.start_permlink;
    let username = req.query.username;

    if (Number.isNaN(limit)) {
        if (user === null || user === undefined || user === '') {
            return next(HELPER._prepare_error(500, 'Required parameters "user" and "limit" are missing.', 'Internal'));
        }
        return next(HELPER._prepare_error(500, 'Required parameter"limit" is missing.', 'Internal'));
    }

    else {
        if (user === null || user === undefined || user === '') {
            return next(HELPER._prepare_error(500, 'Required parameter "user" is missing.', 'Internal'));
        }
    }

    let object = {
        'limit': limit,
        'tag': user
    }

    if (start_author !== undefined && start_permlink !== undefined) {
        object.start_author = start_author;
        object.start_permlink = start_permlink
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

                if (post.reblogged_by.length > 0) {
                    post.reblogged_by = post.reblogged_by[0];
                }

                else {
                    post.reblogged_by = null;
                }

                post.body = HELPER.parse_body(post.body);

                try {
                    post.nsfw = post.json_metadata.tags.includes('nsfw');
                }

                catch(e) {
                    post.nsfw = false;
                }

                return _get_response(post, image, top_likers);
            });

            // If pagination, remove the starting element
            if (start_author !== undefined && start_permlink !== undefined) {
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
            });
        }
    });
});

/**
 * Method to get post comments
 */
router.get('/comments', (req, res, next) => {
    let username = req.query.username;
    let permlink = decodeURIComponent(req.query.permlink);
    let to_delete = permlink.split('/')[2] + "/" + permlink.split('/')[3];
    to_delete = to_delete.replace("@", '');

    if (permlink === undefined || permlink === null || permlink === '') {
        return next(HELPER._prepare_error(500, 'Required parameter "permlink" is missing.', 'Internal'));
    }
    
    let comments = [];
    STEEM.api.getState(permlink, (err, results) => {
        results = JSON.parse(JSON.stringify(results));
        delete results.content[to_delete];

        let result = Object.values(results.content)
        result.sort((a, b) => { 
            return b.id > a.id;   // <== to compare string values
        });

        let final = result.map(comment => {
            return {
                body: comment.body,
                avatar: `https://img.busy.org/@${comment.author}`,
                created: comment.created,
                url: comment.url,
                author_reputation: UTIL.reputation(comment.author_reputation),
                author: comment.author,
                category: comment.category,
                net_votes: comment.net_votes,
                net_likes: comment.net_likes,
                pending_payout_value: parseFloat(comment.total_payout_value) + parseFloat(comment.pending_payout_value),
                vote: HELPER.is_post_voted(username, comment),
                children: comment.children
            }
        });
        final.reverse();
        res.send({
            results: final
        });
    });
});

/**
 * Method to retrieve post votes
 */
router.get('/votes', (req, res, next) => {
    let url = req.query.permlink;
    let author = req.query.author;

    if (author === null || author === undefined || author === '') {
        if (url === null || url === undefined || url === '') {
            return next(HELPER._prepare_error(500, 'Required parameters "author" and "permlink" are missing.', 'Internal'));
        }
        return next(HELPER._prepare_error(500, 'Required parameter "author" is missing.', 'Internal'));
    }

    else {
        if (url === null || url === undefined || url === '') {
            return next(HELPER._prepare_error(500, 'Required parameter "permlink" is missing.', 'Internal'));
        }
    }

    STEEM.api.getActiveVotes(author, url, (err, votes) => {
        let results = votes.map(voter => {
            voter.reputation = UTIL.reputation(voter.reputation);
            voter.percent = voter.percent / 100;
            return {
                profile_image: `https://img.busy.org/@${voter.voter}`,
                username: voter.voter,
                reputation: voter.reputation,
                percent: voter.percent
            }
        });
        res.send({
            results: results
        });
    });
});

module.exports = router;
