const STEEM = require('steem');
var client = require('../utils/steemAPI');
const HELPER = require('./helper');
const UTIL = require('../utils/utils');
var express = require('express');
var router = express.Router();

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
 * Method to dispatch user data
 * @param {*} req 
 * @param {*} res 
 */
router.get('/info', (req, res, next) => {
    let username = req.query.user;

    client.sendAsync('get_accounts', [[username]]).then(rest => {
        let result = rest[0];
        try {
            result.json_metadata = JSON.parse(result.json_metadata);
        }

        catch (e) {
            return next(HELPER._prepare_error(500, 'Wrong user passed', 'Internal'));
        }

        result.reputation = UTIL.reputation(result.reputation);
        let vesting_steem;

        if (parseFloat(result.reward_vesting_steem) == 0) {
            vesting_steem = parseFloat(result.delegated_vesting_shares);
        }

        else {
            vesting_steem = parseFloat(result.reward_vesting_steem)
        }

        let balance = STEEM.formatter.estimateAccountValue(result);

        get_properties().then(data =>  {
            total_vesting_shares = data.total_vesting_shares
            total_vesting_fund_steem = data.total_vesting_fund_steem
        });

        balance.then(bal => {
            let r = {
                created: result.created,
                reputation: result.reputation,
                username: result.name,
                profile_image: `https://img.busy.org/@${result.name}`,
                json_metadata: result.json_metadata,
                estimated_balance: bal,
                post_count: result.post_count,
                vesting_shares: result.vesting_shares,
                sbd_balance: result.sbd_balance,
                balance: result.balance,
                savings_balance: result.savings_balance,
                savings_sbd_balance: result.savings_sbd_balance
            }
            r.delegated_steem_power = (STEEM.formatter.vestToSteem((result.received_vesting_shares.split(' ')[0]) + ' VESTS', total_vesting_shares, total_vesting_fund_steem)).toFixed(0)
            r.outgoing_steem_power = (STEEM.formatter.vestToSteem((result.received_vesting_shares.split(' ')[0] - result.delegated_vesting_shares.split(' ')[0]) + ' VESTS', total_vesting_shares, total_vesting_fund_steem) - r.delegated_steem_power).toFixed(0)
            r.exact_delegation = parseInt(r.delegated_steem_power) + parseInt(r.outgoing_steem_power);

            if (Object.keys(result.json_metadata).length === 0 && result.json_metadata.constructor === Object) {
                res.send(r);
            }
            else {
                r.name = result.json_metadata.profile.name;
                r.about = result.json_metadata.profile.about;
                r.location = result.json_metadata.profile.location;
                r.website = result.json_metadata.profile.website;
                res.send(r);
            }
        });

    }).catch(err => console.log(err));
});

/**
 * Method to get stats from an user
 */
router.get('/stats', async (req, res, next) => {
    let user = req.query.user;

    let follow = await _get_follow_count(user);

    res.send({
        followers_count: follow.follower_count,
        following_count: follow.following_count
    });
});

/**
 * Method to determine if an user is following each other
 */
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
            if (followers[0].follower == user) res.send({ following: true });
            else res.send({ following: false });
        }
        catch (e) { res.send({ following: false }) }
    }).catch(err => res.send({ following: false }));
});

/**
 * Method to get steem power of an user
 */
router.get('/voting_power', async (req, res, next) => {
    let user = req.query.username;

    let account = await get_account(user);
    let globals = await get_properties();

    const totalSteem = Number(globals.total_vesting_fund_steem.split(' ')[0]);
    const totalVests = Number(globals.total_vesting_shares.split(' ')[0]);
    const userVests = Number(account[0].vesting_shares.split(' ')[0]);

    res.send({
        voting_power: totalSteem * (userVests / totalVests)
    });
});

async function get_account(user) {
    return new Promise(resolve => {
        client.sendAsync('get_accounts', [[user]]).then(data => {
            resolve(data);
        }).catch(err => resolve(err));
    });
}

async function get_properties() {
    return new Promise(resolve => {
        client.sendAsync('get_dynamic_global_properties', []).then(data => {
            resolve(data);
        }).catch(err => resolve(err));
    })
}

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