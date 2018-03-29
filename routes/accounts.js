var exports = module.exports = {};
var steem = require('steem');
var Util = require('../utils/utils');
var Accounts = require('../models/accounts');
var Posts = require('../models/posts');

/**
 * Method to check post count in Steemia
 * @param {String} username 
 */
async function _get_posts_count(username) {
    return new Promise(resolve => {
        Posts.count({ author: username, "json_metadata.tags": "steemia" }, (err, count) => {
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
        steem.api.getFollowers(username, target, 'blog', 1, (err, followers) => {
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
        steem.api.getFollowCount(username, (err, follow) => {
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
        steem.api.getAccounts([username], (err, res) => {
            if (res) {

                let result = res[0];
                try {
                    result.json_metadata = JSON.parse(result.json_metadata);
                }

                catch (e) {
                    resolve("wrong user")
                }

                result.reputation = Util.reputation(result.reputation);
                var steemPower = parseFloat(result.reward_vesting_steem) * (parseFloat(result.vesting_shares) / parseFloat(result.reward_vesting_balance));

                var balance = steem.formatter.estimateAccountValue(result);
                balance.then(data => {
                    let r = {
                            created: result.created,
                            reputation: result.reputation,
                            username: result["name"],
                            profile_image: "https://img.busy.org/@" + result.name,
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
    var user = req.query.user || null;
    user = user.toString();
    console.log(user)
    var username = req.query.username;

    // Get account data
    var account = await _get_account(user);

    if (account !== "wrong user") {
        // Get follow stats
        var follow = await _get_follow_count(user);

        account.followers_count = follow.follower_count;
        account.following_count = follow.following_count;

        // Check if the current user has followed this user
        var has_followed = await _is_following(user, username);

        account.has_followed = has_followed;

        // Get post count of this user in steemia
        var post_count = await _get_posts_count(user);

        account.post_count = post_count;

        res.send(account);
    }

    else {
        res.send({
            error: "invalid user"
        });
    }


}

exports.get_account = get_account;