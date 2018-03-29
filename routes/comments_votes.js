var exports = module.exports = {};
var Comments = require('../models/comments');
var Helper = require('./helper');
var Util = require('../utils/utils');
var steem = require('steem');

function get_comments(req, res) {
    let username = req.query.username;
    let permlink = decodeURIComponent(req.query.permlink);
    let to_delete = permlink.split('/')[2] + "/" + permlink.split('/')[3];
    to_delete = to_delete.replace("@", '');
    
    let comments = [];
    steem.api.getState(permlink, (err, results) => {
        results = JSON.parse(JSON.stringify(results));
        delete results.content[to_delete];

        var result = Object.values(results.content)
        result.sort(function(a, b) { 
            return b.id > a.id;   // <== to compare string values
        });

        var final = result.map(comment => {
            return {
                body: comment.body,
                avatar: "https://img.busy.org/@" + comment.author,
                created: comment.created,
                url: comment.url,
                author_reputation: Util.reputation(comment.author_reputation),
                author: comment.author,
                category: comment.category,
                net_votes: comment.net_votes,
                net_likes: comment.net_likes,
                pending_payout_value: parseFloat(comment.total_payout_value) + parseFloat(comment.pending_payout_value),
                vote: Helper.is_post_voted(username, comment),
                children: comment.children
            }
        });
        final.reverse();
        res.send({
            results: final
        })
    });
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