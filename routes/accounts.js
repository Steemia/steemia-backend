var exports = module.exports = {};
const STEEM = require('steem');
const UTIL = require('../utils/utils');
const ACCOUNTS = require('../models/accounts');
const POSTS = require('../models/posts');

/**
 * Method to check post count in Steemia
 * @param {String} username 
 */
async function _get_posts_count(username) {
    return new Promise(resolve => {
        POSTS.count({ author: username, 'json_metadata.tags': 'steemia' }, (err, count) => {
            if (count) resolve(count);
            else resolve(err);
        });
    });
}

/**
 * Method to check if the logged in user is following the queried user
 * @param {String} username 
 * @param {String} target 
 */
async function _is_following(username, target) {
    return new Promise(resolve => {
        STEEM.api.getFollowers(username, target, 'blog', 1, (err, followers) => {
            if (followers[0].follower == target) resolve(1);
            else resolve(0);
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
async function get_account(req, res) {
    let user = req.query.user || null;
    user = user.toString();
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

        // Get post count of this user in steemia
        let post_count = await _get_posts_count(user);

        account.post_count = post_count;

        res.send(account);
    }

    else {
        res.send({
            error: 'invalid user'
        });
    }

}

exports.get_account = get_account;