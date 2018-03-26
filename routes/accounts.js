var exports = module.exports = {};
var steem = require('steem');
var Util = require('../utils/utils');
var Accounts = require('../models/accounts');

function get_user(req, res) {
    var username = req.query.username;

    Accounts.aggregate([
        { name: username },
        { "$lookup": {
          "localField": "account",
          "from": "Posts",
          "foreignField": "author",
          "as": "userinfo"
        } },
        { "$unwind": "$userinfo" }
      ]).exec((err, res) => {
          console.log(res)
      })

    // var account = Accounts.findOne({ name: username })
    // var name = account.map(function(c) { return c.account; });

    // steem.api.getFollowers(name, 'startFollower', 'blog', 1000, (err, result) => {
    //     console.log(err, result);
    // });

    // Accounts
    //     .findOne({ name: username})
    //     .lean()
    //     .exec((err, info) => {

    //         info.reputation = Util.reputation(info.reputation);
            
    //         res.send({
    //             created: info["created"],
    //             reputation: info["reputation"],
    //             username: info["account"],
    //             profile_image: "https://img.busy.org/@" + info["account"],

    //         })
    //     });
}

exports.get_user = get_user;