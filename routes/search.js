const POSTS = require('../models/posts');
const ACCOUNTS = require('../models/accounts');
const UTIL = require('../utils/utils');
const HELPER = require('./helper');
const STEEM = require('steem');
var exports = module.exports = {};
const async = require('async');

/**
 * Method to get full text search of posts querying their title and body
 * @param {*} req 
 * @param {*} res 
 */
function search_text(req, res) {
    let username = req.query.username;
    let text = req.query.search;
    
    POSTS.find(
        {
            'json_metadata.tags': 'steemia',
            $or: [
                { 'title': { $regex: text, $options: 'i' } },
                { 'body': { $regex: text, $options: 'i' } }
            ]
        }, {
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
    ).sort({ 'created': -1 }).limit(100).lean().exec((err, result) => {

        let results = result.map(doc => {
            doc = JSON.parse(JSON.stringify(doc));
            // Check if user has voted this post.
            doc.vote = HELPER.is_post_voted(username, doc);

            // Get body image of the post.
            let image = HELPER.get_body_image(doc);

            // Get videos of the post
            doc.videos = HELPER.get_body_video(doc);

            doc.total_payout_value.amount += doc.pending_payout_value.amount;
            doc.author_reputation = UTIL.reputation(doc.author_reputation);

            doc.tags = doc.tags.filter((item, index, self) => self.indexOf(item) == index);

            let top_likers = HELPER.get_top_likers(doc.active_votes);

            return {
                author: doc.author,
                avatar: `https://img.busy.org/@${doc.author}`,
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
                net_likes: doc.net_votes,
                net_votes: doc.net_votes,
                max_accepted_payout: doc.max_accepted_payout.amount,
                total_payout_reward: doc.total_payout_value.amount,
                videos: doc.videos || null,
                top_likers_avatars: top_likers
            }
        });

        res.send({
            results: results,
            type: 'full_text_search'
        });
    });
}

/**
 * Method to search posts by tag
 * @param {*} req 
 * @param {*} res 
 */
function search_tags(req, res) {
    let limit = parseInt(req.query.limit);
    let skip = parseInt(req.query.skip);
    let username = req.query.username;
    let text = req.query.search;

    POSTS
        .find(
            {
                'json_metadata.tags': 'steemia',
                $and: [
                    { 'json_metadata.tags': { $regex: text, $options: 'i' } }
                ]
            }, {
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
        ).sort({ 'created': -1 }).limit(100).lean().exec((err, result) => {
            let results = result.map(post => {
                post = JSON.parse(JSON.stringify(post));
                // Check if user has voted this post.
                post.vote = HELPER.is_post_voted(username, post);

                // Get body image of the post.
                let image = HELPER.get_body_image(post);

                // Get videos of the post
                post.videos = HELPER.get_body_video(post);

                post.total_payout_value.amount += post.pending_payout_value.amount;
                post.author_reputation = UTIL.reputation(post.author_reputation);

                post.tags = post.tags.filter((item, index, self) => self.indexOf(item) == index);

                let top_likers = HELPER.get_top_likers(post.active_votes);

                return {
                    author: post.author,
                    avatar: `https://img.busy.org/@${post.author}`,
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
                    net_likes: post.net_votes,
                    net_votes: post.net_votes,
                    max_accepted_payout: post.max_accepted_payout.amount,
                    total_payout_reward: post.total_payout_value.amount,
                    videos: post.videos || null,
                    top_likers_avatars: top_likers
                }
            });

            res.send({
                results: results,
                type: 'tags_search'

            })
        });
}

async function search_users(req, res) {
    let username = req.query.username;
    let query = req.query.search;

    ACCOUNTS
        .find({
            $or: [
                { 'name': { $regex: query, $options: 'i' } },
            ]
        })
        .lean()
        .exec(async (err, users) => {
            let results = await call_followers(users);

            let final = results.map(user => {
                let following = HELPER.is_following(username, user);
                user.reputation = UTIL.reputation(user.reputation);

                return {
                    name: user.name,
                    avatar: `https://img.busy.org/@${user.name}`,
                    reputation: user.reputation,
                    has_followed: following,
                }
            });
            res.send({
                results: final,
                type: 'user_search'
            });
        });
}

async function get_followers(user) {
    return new Promise(resolve => {
        STEEM.api.getFollowers(user.toString(), '', 'blog', 1000, (err, res) => {
            resolve(res)
        });
    });
}

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
        } catch (err) {
        }
    }

    return users_data;

}

exports.search_text = search_text;
exports.search_tags = search_tags;
exports.search_users = search_users;