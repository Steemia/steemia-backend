const UTIL = require('../utils/utils');
const HELPER = require('./helper');
const STEEM = require('steem');
var client = require('../utils/steemAPI');
var express = require('express');
var router = express.Router();
var request = require('request');
const marked = require('marked');

const ASK_STEEM = 'https://api.asksteem.com/';

/**
 * Method to get full text search of posts querying their title and body
 */
router.get('/posts', async (req, res, next) => {

    let username = req.query.username;
    let text = req.query.search;
    let page = req.query.page;

    if (text === null || text === undefined || text === '') {
        if (page === null || page === undefined || page === '') {
            return next(HELPER._prepare_error(500, 'Required parameters "search" and "page" are missing.', 'Internal'));
        }
        else {
            if (parseInt(page) > 10) {
                return next(HELPER._prepare_error(500, 'Required parameter "page" cannot be larger than 10', 'Internal'));
            }
            return next(HELPER._prepare_error(500, 'Required parameter "search" is missing.', 'Internal'));
        }
        
    }
    else {
        if (page === null || page === undefined || page === ''){
            return next(HELPER._prepare_error(500, 'Required parameter "page" is missing.', 'Internal'));
        }
        else {
            if (parseInt(page) > 10) {
                return next(HELPER._prepare_error(500, 'Required parameter "page" cannot be larger than 10', 'Internal'));
            }
        }
    }

    request(ASK_STEEM + 'search?q=' + text + '&types=post&sort_by=created&pg=' + page, (error, response, body) => {

        var data = JSON.parse(body);
        var results = data.results;

        let final = results.map(async post => {
            post = JSON.parse(JSON.stringify(post));

            let missing_data = await _get_body(post.author, post.permlink);
            post.active_votes = missing_data.active_votes;

            post.vote = HELPER.is_post_voted(username, post);
            post.body = missing_data.body;
            post.body = HELPER.parse_body(post.body);

            let image = HELPER.get_body_image(post);
            post.videos = HELPER.get_body_video(post);

            let top_likers = HELPER.get_top_likers(post.active_votes);

            return {
                author: post.author,
                avatar: 'https://steemitimages.com/u/' + post.author + '/avatar/small',
                author_reputation: UTIL.reputation(missing_data.author_reputation),
                title: post.title,
                full_body: marked(post.body),
                url: post.permlink,
                created: post.created,
                tags: post.tags,
                category: post.tags[0],
                children: post.children,
                body: image,
                vote: post.vote,
                net_likes: post.net_votes,
                net_votes: post.net_votes,
                max_accepted_payout: parseFloat(missing_data.max_accepted_payout),
                total_payout_reward: parseFloat(missing_data.total_payout_value) + parseFloat(missing_data.pending_payout_value),
                videos: post.videos || null,
                top_likers_avatars: top_likers
            }
        });

        Promise.all(final).then((completed) => {
            res.send({
                results: completed,
                type: 'full_text_search'
            })
        });
    });
});

/**
 * Method to search posts by tag
 */
router.get('/tags', (req, res, next) => {
    let username = req.query.username;
    let text = req.query.search;
    let page = req.query.page;

    if (text === null || text === undefined || text === '') {
        if (page === null || page === undefined || page === '') {
            return next(HELPER._prepare_error(500, 'Required parameters "search" and "page" are missing.', 'Internal'));
        }
        else {
            if (parseInt(page) > 10) {
                return next(HELPER._prepare_error(500, 'Required parameter "page" cannot be larger than 10', 'Internal'));
            }
            return next(HELPER._prepare_error(500, 'Required parameter "search" is missing.', 'Internal'));
        }
        
    }

    else {
        if (page === null || page === undefined || page === ''){
            return next(HELPER._prepare_error(500, 'Required parameter "page" is missing.', 'Internal'));
        }
        else {
            if (parseInt(page) > 10) {
                return next(HELPER._prepare_error(500, 'Required parameter "page" cannot be larger than 10', 'Internal'));
            }
        }
    }

    request(ASK_STEEM + 'search?q=tags%3A' + text + '&types=post&sort_by=created&pg=' + page, (error, response, body) => {

        var data = JSON.parse(body);
        var results = data.results;

        let final = results.map(async post => {
            post = JSON.parse(JSON.stringify(post));

            let missing_data = await _get_body(post.author, post.permlink);
            post.active_votes = missing_data.active_votes;

            post.vote = HELPER.is_post_voted(username, post);
            post.body = missing_data.body;
            post.body = HELPER.parse_body(post.body);

            missing_data.total_payout_value.amount += missing_data.pending_payout_value.amount;
            missing_data.author_reputation = UTIL.reputation(missing_data.author_reputation);

            let image = HELPER.get_body_image(post);
            post.videos = HELPER.get_body_video(post);

            let top_likers = HELPER.get_top_likers(post.active_votes);

            return {
                author: post.author,
                avatar: 'https://images.steemitimages.com/u/' + post.author + '/avatar/small',
                author_reputation: UTIL.reputation(missing_data.author_reputation),
                title: post.title,
                full_body: marked(post.body),
                url: post.permlink,
                created: post.created,
                tags: post.tags,
                category: post.tags[0],
                children: post.children,
                body: image,
                vote: post.vote,
                net_likes: post.net_votes,
                net_votes: post.net_votes,
                max_accepted_payout: parseFloat(missing_data.max_accepted_payout),
                total_payout_reward: parseFloat(missing_data.total_payout_value) + parseFloat(missing_data.pending_payout_value),
                videos: post.videos || null,
                top_likers_avatars: top_likers
            }
        });

        Promise.all(final).then((completed) => {
            res.send({
                results: completed,
                type: 'tags_search'
            })
        });
    });
});

/**
 * Method to search for users
 */
router.get('/users', async (req, res, next) => {
    let username = null;
    try {
        username = req.query.username.toLowerCase();
    } catch (e) {}
    
    let text = req.query.search;

    if (text === null || text === undefined || text === '') {
        return next(HELPER._prepare_error(500, 'Required parameter "search" is missing.', 'Internal'));
    }

    client.sendAsync('call', ["follow_api", "get_account_reputations", [text, 20]]).then(async result => {

        let results = result.map(async user => {
            let has_followed;
            if (username !== null || username !== undefined || username !== '') {
                if (username === null) {
                    has_followed = false;
                } else {
                    has_followed = await _is_following(user.account.toString(), username);
                }
                
            }

            else {
                has_followed = false;
            }

            return {
                name: user.account,
                avatar: 'https://images.steemitimages.com/u/' + user.account + '/avatar/small',
                reputation: null,
                has_followed: has_followed
            }
        });

        Promise.all(results).then(completed => {
            res.send({
                results: completed,
                type: 'user_search'
            });
        });
        
    }).catch(err => console.log(err));
});

/**
 * Method to check if the logged in user is following the queried user
 * @param {String} username 
 * @param {String} target 
 */
async function _is_following(username, target) {
    return new Promise(resolve => {
        client.sendAsync('get_followers', [username, target, 'blog', 1]).then(followers => {
            try {
                if (followers[0].follower == target) resolve(1);
                else resolve(0);
            }
            catch(e) { resolve(0) }
        }).catch(err => resolve(0));
    });
}

/**
 * Method to get post data
 * @param {String} author 
 * @param {String} permlink 
 * @returns a promise with the post body
 */
async function _get_body(author, permlink) {
    return new Promise(resolve => {
        client.sendAsync('get_content', [author, permlink]).then(result => {
            if (result) resolve(result);
        }).catch(err => resolve(err));
    });
}

/**
 * Method to get user followers
 * @param {String} user 
 * @returns a promise with the followers
 */
async function get_followers(user) {
    return new Promise(resolve => {
        client.sendAsync('get_followers', [user.toString(), '', 'blog', 1000]).then(res => {
            resolve(res);
        }).catch(err => resolve(err));
    });
}

/**
 * Method to call followers
 * @param {Array<object>} users 
 * @returns an array with the followers
 */
async function call_followers(users) {
    let users_data = [];
    for (let i = 0; i < users.length; i++) {
        try {
            users[i] = JSON.parse(JSON.stringify(users[i]));
            let success = await get_followers(users[i].name);
            if (success) {
                users[i].followers = success;
                users_data.push(users[i]);
            }
        } catch (err) { resolve(err); }
    }
    return users_data;
}

module.exports = router;
