var Posts = require('../models/posts');
var Accounts = require('../models/accounts');
var Util = require('../utils/utils');
var Helper = require('./helper');
var steem = require('steem');
var exports = module.exports = {};
var async = require('async');

/**
 * Method to get full text search of posts querying their title and body
 * @param {*} req 
 * @param {*} res 
 */
function search_text(req, res) {
    var limit = parseInt(req.query.limit);
    var skip = parseInt(req.query.skip);
    var username = req.query.username;
    var text = req.query.search;

    var cursor = Posts
        .find(
            {
                "json_metadata.tags": "steemia",
                $or: [
                    { 'title': { $regex: text, $options: 'i' } },
                    { 'body': { $regex: text, $options: 'i' } }
                ]
            }, {
                "abs_rshares": 1,
                "created": 1,
                "author": 1,
                "author_reputation": 1,
                "title": 1,
                "body": 1,
                "url": 1,
                "tags": 1,
                "category": 1,
                "children": 1,
                "net_votes": 1,
                "max_accepted_payout": 1,
                "total_payout_value": 1,
                "pending_payout_value": 1,
                "active_votes": 1,
                "json_metadata": 1
            }
        ).sort({ 'created': -1 }).limit(limit).skip(skip).lean().cursor()

    var firstItem = true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    cursor.on('data', (doc) => {

        doc = JSON.parse(JSON.stringify(doc));
        // Check if user has voted this post.
        doc["vote"] = Helper.is_post_voted(username, doc);

        // Get body image of the post.
        var image = Helper.get_body_image(doc);

        // Get videos of the post
        doc["videos"] = Helper.get_body_video(doc);

        doc.total_payout_value["amount"] += doc.pending_payout_value["amount"];
        doc.author_reputation = Util.reputation(doc.author_reputation);

        doc.tags = doc.tags.filter((item, index, self) => self.indexOf(item) == index);

        var top_likers = Helper.get_top_likers(doc.active_votes);

        var item = {
            author: doc.author,
            avatar: "https://img.busy.org/@" + doc.author,
            author_reputation: doc.author_reputation,
            title: doc.title,
            full_body: doc.body,
            url: doc.url,
            created: doc.created,
            tags: doc.tags,
            category: doc.category,
            children: doc.children,
            body: image,
            vote: doc.vote,
            net_votes: doc.net_votes,
            max_accepted_payout: doc.max_accepted_payout["amount"],
            total_payout_reward: doc.total_payout_value["amount"],
            videos: doc.videos || null,
            top_likers_avatars: top_likers
        }

        res.write(firstItem ? (firstItem = false, '[') : ',');
        res.write(JSON.stringify(item));
    });
    cursor.on('close', function () {
        res.end(']');
    });
}

/**
 * Method to search posts by tag
 * @param {*} req 
 * @param {*} res 
 */
function search_tags(req, res) {
    var limit = parseInt(req.query.limit);
    var skip = parseInt(req.query.skip);
    var username = req.query.username;
    var text = req.query.search;

    var cursor = Posts
        .find(
            {
                "json_metadata.tags": "steemia",
                $and: [
                    { "json_metadata.tags": { $regex: text, $options: 'i' } }
                ]
            }, {
                "abs_rshares": 1,
                "created": 1,
                "author": 1,
                "author_reputation": 1,
                "title": 1,
                "body": 1,
                "url": 1,
                "tags": 1,
                "category": 1,
                "children": 1,
                "net_votes": 1,
                "max_accepted_payout": 1,
                "total_payout_value": 1,
                "pending_payout_value": 1,
                "active_votes": 1,
                "json_metadata": 1
            }
        ).sort({ 'created': -1 }).limit(limit).skip(skip).lean().cursor();

    var firstItem = true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    cursor.on('data', function (post) {
        post = JSON.parse(JSON.stringify(post));
        // Check if user has voted this post.
        post["vote"] = Helper.is_post_voted(username, post);

        // Get body image of the post.
        var image = Helper.get_body_image(post);

        // Get videos of the post
        post["videos"] = Helper.get_body_video(post);

        post.total_payout_value["amount"] += post.pending_payout_value["amount"];
        post.author_reputation = Util.reputation(post.author_reputation);

        post.tags = post.tags.filter((item, index, self) => self.indexOf(item) == index);

        var top_likers = Helper.get_top_likers(post.active_votes);

        var item = {
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

        res.write(firstItem ? (firstItem = false, '[') : ',');
        res.write(JSON.stringify(item));
    });

    cursor.on('close', function() {
        res.end(']');
    });
       
}

async function search_users(req, res) {
    var username = req.query.username;
    var query = req.query.name;

    Accounts
        .find({
            $or: [
                { 'name': { $regex: query, $options: 'i' } },
            ]
        })
        .lean()
        .exec(async (err, users) => {
            var results = await call_followers(users);

            var final = results.map(user => {
                let following = Helper.is_following(username, user);
                user["reputation"] = Util.reputation(user["reputation"]);

                return {
                    name: user["name"],
                    reputation: user["reputation"],
                    has_followed: following,
                }
            });
            res.send({
                results: final
            });
        });
}

async function get_followers(user) {
    return new Promise(resolve => {
        steem.api.getFollowers(user.toString(), '', 'blog', 1000, (err, res) => {
            resolve(res)
        });
    });
}

async function call_followers(users) {
    let users_data = [];
    for (let i = 0; i < users.length; i++) {
        try {
            users[i] = JSON.parse(JSON.stringify(users[i]));

            let success = await get_followers(users[i]["name"]);
            if (success) {
                users[i]["followers"] = success
                users_data.push(users[i]);
            }
        } catch (err) {
            console.log(err)
        }
    }

    return users_data

}

exports.search_text = search_text;
exports.search_tags = search_tags;
exports.search_users = search_users;