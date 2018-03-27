var exports = module.exports = {};

/**
 * Method to get top likers from a post.
 * @param {Array<Object>} object 
 * @returns returns a new Object Array with top 3 likers.
 */
function get_top_likers(object) {
    var top_likers = [];
    if (object.length !== 0) {

        for (let i = 0; i < 3; i++) {
            if (object[i] != null) {
                top_likers.push("https://img.busy.org/@" + object[i]["voter"]);
            }
        }
    }
    return top_likers;
}

/**
 * Method to determine is user has voted a post
 * @param {String} username 
 * @param object 
 * @returns returns a boolean statement
 */
function is_post_voted(username, object) {
    var is_voted = false;
    if (username) {
        if (object["active_votes"].length === 0) {
            is_voted = false;
        }

        else {
            let string = JSON.stringify(object["active_votes"], null, '\n')
                             .replace(/"/g, '\\"')
                             .replace(/\n/g, '    ')
                             .replace(/(?:[ ]{4}((?:[ ]{4})*))/g, '\\n$1');
            let match = string.match(username);
            
            try {
                if (match.index !== null || match !== undefined) {
                    is_voted = true;
                } 
    
                else {
                    is_voted = false;
                }
            }

            catch (e) {
                is_voted = false;
            }
            
        }
    }

    else {
        is_voted = false;
    }

    return is_voted;
}

function is_following(username, object) {
    var is_following = false;
    if (username) {
        console.log(object["followers"])
        if (object["followers"].length === 0) {
            is_following = false;
        }

        else {
            for (let i = 0; i < object["followers"].length; i++) {
                if (object["followers"][i].follower == username) {
                    is_following = true;
                }
            }
        }
    }

    return is_following;
}

/**
 * Method to get body image of the post
 * @param {*} post 
 * @returns returns a string with the image url
 */
function get_body_image(post) {
    var image;

    try {
        image = post.json_metadata["image"][0]
    }

    catch (e) {
        var n = post.body.match(/([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/i)
        if (n === null) image = null;
        else {
            image = n[0];
        };
    }

    return image;
}

/**
 * Method to get videos of the post
 * @param {*} post
 * @returns Array with videos of the post 
 */
function get_body_videos(post) {
    var videos = null;
    var v = post.body.match(/^(http:\/\/|https:\/\/)(vimeo\.com|youtu\.be|www\.youtube\.com)\/([\w\/]+)([\?].*)?$/igm);

    if (v !== null) {
        videos = v;
    }
    return videos
}

exports.get_top_likers = get_top_likers;
exports.is_post_voted = is_post_voted;
exports.get_body_image = get_body_image;
exports.get_body_video = get_body_videos;
exports.is_following = is_following;