const STEEM = require('steem');
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
        STEEM.api.getFollowers(username, target, 'blog', 1, (err, followers) => {
            try {
                if (followers[0].follower == target) resolve(1);
                else resolve(0);
            }
            catch(e) { resolve(0) }
        });
    });
}

/**
 * Method to get follow stats of an user
 * @param {String} username 
 */
async function _get_follow_count(username) {
    return new Promise(resolve => {
        STEEM.api.getFollowCount(username, (err, follow) => {
            if (follow) resolve(follow)
            else resolve(err);
        });
    });
}

/**
 * Method to retrieve user data
 * @param {String} username 
 */
async function _get_account(username) {
    return new Promise(resolve => {
        STEEM.api.getAccounts([username], (err, res) => {
            if (res) {

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
            }
            else resolve(err);
        });
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
            // Get follow stats
            let follow = await _get_follow_count(user);

            account.followers_count = follow.follower_count;
            account.following_count = follow.following_count;

            // Check if the current user has followed this user
            let has_followed = await _is_following(user, username);

            account.has_followed = has_followed;

            res.send(account);
        }

        else {
            res.send({
                error: 'invalid user'
            });
        }
    }
    catch(e) {
        next(e)
    }
});

module.exports = router;