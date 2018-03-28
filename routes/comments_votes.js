var exports = module.exports = {};
var Comments = require('../models/comments');
var Posts = require('../models/posts');
var Helper = require('./helper');
var Util = require('../utils/utils');
var steem = require('steem');
var request = require('request');
var Promise = require("bluebird");

function get_comments(req, res) {
    let author = 'jaysermendez';
    let permlink = 'steemia/@jaysermendez/steemia-full-text-search-text';
    let comments = [];
    steem.api.getState(permlink, (err, results) => {
        results = JSON.parse(JSON.stringify(results));
        delete results.content['jaysermendez/steemia-full-text-search-text'];

        var result = Object.values(results.content)
        result.sort(function(a, b) { 
            return b.id > a.id;   // <== to compare string values
        });
        res.send(result)
    })
    // steem.api.getContentReplies(author, permlink, (err, replies) => {

    //     let result = replies.map(reply => {
    //         comments.push(reply)
    //         if (reply.children > 0) {

    //             return 
    //         }

    //     })

    //     res.send(post.content)
    // })
}



/**
 * Method to retrieve post comments
 * @param {*} req 
 * @param {*} res 
 */
function get_comments_rec(req, res) {
    var limit = parseInt(req.query.limit);
    var skip = parseInt(req.query.skip);
    var username = req.query.username;
    var url = req.params.url;

    Comments
        .find({ category: "steemia", parent_permlink: url })
        .sort({ 'created': -1 })
        .limit(limit)
        .skip(skip)
        .exec((err, comments) => {

            var results = comments.map(comment => {

                comment = JSON.parse(JSON.stringify(comment));
                comment["vote"] = Helper.is_post_voted(username, comment);
                comment.total_payout_value["amount"] += comment.pending_payout_value["amount"];
                comment.author_reputation = Util.reputation(comment.author_reputation);
                comment["vote"] = Helper.is_post_voted(username, comment);

                return {
                    author: comment.author,
                    avatar: "https://img.busy.org/@" + comment.author,
                    full_body: comment.body,
                    author_reputation: comment.author_reputation,
                    created: comment.created,
                    children: comment.children,
                    vote: comment["vote"],
                    replies: comment["replies"],
                    url: comment["permlink"]
                };
            });
            res.send({
                results: results
            });
        });
}

/**
 * Method to retrieve post votes
 * @param {*} req 
 * @param {*} res 
 */
function get_votes(req, res) {
    var url = req.query.permlink;
    var author = req.query.author;
    steem.api.getActiveVotes(author, url, (err, votes) => {
        var results = votes.map(voter => {
            voter["reputation"] = Util.reputation(voter["reputation"]);
            voter["percent"] = voter["percent"] / 100;

            return {
                profile_image: "https://img.busy.org/@" + voter["voter"],
                username: voter["voter"],
                reputation: voter["reputation"],
                percent: voter["percent"]
            }

        });

        res.send({
            results: results
        });
    });

}

exports.get_votes = get_votes;
exports.get_comments = get_comments;