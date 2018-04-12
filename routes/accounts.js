const STEEM = require('steem');
var client = require('../utils/steemAPI');
const HELPER = require('./helper');
const UTIL = require('../utils/utils');
var express = require('express');
var router = express.Router();

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
            catch (e) { resolve(0) }
        }).catch(err => resolve(0));
    });
}

/**
 * Method to get follow stats of an user
 * @param {String} username 
 */
async function _get_follow_count(username) {
    return new Promise(resolve => {
        client.sendAsync('get_follow_count', [username]).then(follow => {
            resolve(follow);
        }).catch(err => resolve(err));
    });
}

/**
 * Method to retrieve user data
 * @param {String} username 
 */
async function _get_account(username) {
    return new Promise(resolve => {
        client.sendAsync('get_accounts', [[username]]).then(res => {
            let result = res[0];
            try {
                result.json_metadata = JSON.parse(result.json_metadata);
            }

            catch (e) {
                resolve('wrong user')
            }

            result.reputation = UTIL.reputation(result.reputation);
            let steemPower = parseFloat(result.reward_vesting_steem) * (parseFloat(result.vesting_shares) / parseFloat(result.reward_vesting_balance));

            let balance = STEEM.formatter.estimateAccountValue(result);
            balance.then(data => {
                let r = {
                    created: result.created,
                    reputation: result.reputation,
                    username: result.name,
                    profile_image: `https://img.busy.org/@${result.name}`,
                    has_followed: 0,
                    voting_power: parseFloat(steemPower.toFixed(2)),
                    json_metadata: result.json_metadata,
                    estimated_balance: data,
                    post_count: result.post_count,
                    sbd_balance: result.sbd_balance,
                    balance: result.balance,

                }
                if (Object.keys(result.json_metadata).length === 0 && result.json_metadata.constructor === Object) {
                    resolve(r);
                }
                else {
                    r.name = result.json_metadata.profile.name;
                    r.about = result.json_metadata.profile.about;
                    r.location = result.json_metadata.profile.location;
                    r.website = result.json_metadata.profile.website;
                    resolve(r);
                }

            });
        }).catch(err => resolve(err));
    });
}

/**
 * Method to dispatch user data
 * @param {*} req 
 * @param {*} res 
 */
router.get('/info', async (req, res, next) => {
    try {
        let user = req.query.user;
        let username = req.query.username;

        // Get account data
        let account = await _get_account(user);

        if (account !== "wrong user") {
            account.has_followed = false;
            res.send(account);
        }

        else {
            res.send({
                error: 'invalid user'
            });
        }
    }
    catch (e) {
        next(e)
    }
});

router.get('/stats', async (req, res, next) => {
    let user = req.query.user;

    let follow = await _get_follow_count(user);

    res.send({
        followers_count: follow.follower_count,
        following_count: follow.following_count
    });
});

router.get('/is_following', (req, res, next) => {
    let username = req.query.username;
    let user = req.query.user;

    if (username === '' || username === undefined || user === null) {
        if (user === '' || user === undefined || user === null) {
            return next(HELPER._prepare_error(500, 'Required parameters "username" and "user" are missing.', 'Internal'));
        }
        return next(HELPER._prepare_error(500, 'Required parameter "username" is missing.', 'Internal'));
    }

    else {
        if (user === '' || user === undefined || user === null) {
            return next(HELPER._prepare_error(500, 'Required parameter "user" is missing.', 'Internal'));
        }
    }

    client.sendAsync('get_followers', [username, user, 'blog', 1]).then(followers => {
        try {
            if (followers[0].follower == user) res.send({following: true});
            else res.send({following: false});
        }
        catch (e) { res.send({following: false}) }
    }).catch(err => res.send({following: false}));
})

/**
 * Generic method to get followers/following of an user
 * @param {*} username 
 * @param {*} limit 
 * @param {*} start 
 * @param {*} fn 
 * @param {*} type 
 */
async function getFollows(username, limit, start, fn, type) {
    return new Promise(resolve => {

        client.sendAsync(fn, [username, start, 'blog', limit]).then(result => {
            if (result.length === 1) {
                if (result[0][type] === start) {
                    resolve({
                        results: [],
                        offset: null
                    });
                }
            }

            let following = result.map(user => {

                return {
                    account: user[type],
                    avatar: 'https://steemitimages.com/u/' + user[type] + '/avatar/small'
                }

            });

            if (following[0].account === "") {
                following.shift();
            }

            if (start !== '' || start !== undefined || start !== null) {
                following.shift();
            }

            resolve({
                results: following,
                offset: following[following.length - 1].account
            });

        }).catch(err => console.log(err));
    });
}

/**
 * Method to dispatch followers of an user
 */
router.get('/followers', async (req, res, next) => {
    let username = req.query.username;
    let limit = req.query.limit;
    let start_follower = req.query.start;

    if (start_follower === '' || start_follower === null || start_follower === undefined) {
        start_follower = '';
    }

    if (username === '' || username === null || username === undefined) {
        next(HELPER._prepare_error(500, 'Required parameter "username" is missing.', 'Internal'));
    }

    let followers = await getFollows(username, limit, start_follower, 'get_followers', 'follower');

    res.send(followers);
});

/**
 * Method to dispatch following of an user
 */
router.get('/following', async (req, res, next) => {
    let username = req.query.username;
    let limit = req.query.limit;
    let start_follower = req.query.start;

    if (start_follower === '' || start_follower === null || start_follower === undefined) {
        start_follower = '';
    }

    if (username === '' || username === null || username === undefined) {
        next(HELPER._prepare_error(500, 'Required parameter "username" is missing.', 'Internal'));
    }

    let following = await getFollows(username, limit, start_follower, 'get_following', 'following');

    res.send(following);
});

module.exports = router;