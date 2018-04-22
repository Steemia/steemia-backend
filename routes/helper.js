var exports = module.exports = {};

/**
 * Method to get top likers from a post.
 * @param {Array<Object>} object 
 * @returns returns a new Object Array with top 3 likers.
 */
function get_top_likers(object) {
    let top_likers = [];
    let limit = 3;
    if (object.length !== 0) {

        for (let i = 0; i < limit; i++) {
            if (object[i] != null) {
                if (object[i].percent <= 0) { limit = 4; }
                else {
                    top_likers.push('https://steemitimages.com/u/' + object[i].voter + '/avatar/small');
                }

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
    let is_voted = false;
    if (username) {
        if (object.active_votes.length === 0) {
            is_voted = false;
        }

        else {
            let string = JSON.stringify(object.active_votes, null, '\n')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '    ')
                .replace(/(?:[ ]{4}((?:[ ]{4})*))/g, '\\n$1');
            let match = string.match(username);

            let obj = object.active_votes.find(o => o.voter === username);

            try {
                if (match.index !== null || match !== undefined) {
                    if (obj.percent === 0) {
                        is_voted = false;
                    }
                    else {
                        is_voted = true;
                    }

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
    let is_following = false;
    if (username) {
        if (object.followers.length === 0) {
            is_following = false;
        }

        else {
            for (let i = 0; i < object.followers.length; i++) {
                if (object.followers[i].follower == username) {
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
    let image;

    try {
        image = post.json_metadata.image[0];
    }

    catch (e) {
        let n = post.body.match(/https?:\/\/(?:[-a-zA-Z0-9._]*[-a-zA-Z0-9])(?::\d{2,5})?(?:[/?#](?:[^\s"'<>\][()]*[^\s"'<>\][().,])?(?:(?:\.(?:tiff?|jpe?g|gif|png|svg|ico)|ipfs\/[a-z\d]{40,})))/gi)
        if (n === null) {
            let images = post.body.match(
                /^(https?\:\/\/)?(www\.)?(steemit-production-imageproxy-thumbnail.s3.amazonaws\.com)\/[a-zA-Z0-9_.-]*/gmi
            );
            if (images !== null) {
                image = images[0];
            }

            else {
                image = null;
            }
        }
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
    let videos = null;
    let v = post.body.trim().match(/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/igm);
    if (v !== null) {
        videos = v;
    }
    return videos
}

function parse_videos(body) {
    try {
        let v = body.trim().match(/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/igm);
        if (v !== null) {
            v.map(video => {
                let url = 'https://youtube.com/embed/';
                let id = YouTubeGetID(video);
                url += id;
                body = body.replace(video, '<iframe width="100%" height="320px" src="' + url + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>');
            });
        }
    } catch (e) { console.log(e) }

    return body;
}

function YouTubeGetID(url) {
    var ID = '';
    url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if (url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_\-]/i);
        ID = ID[0];
    }
    else {
        ID = url;
    }
    return ID;
}

/**
 * Method to replace images with markdown
 * @param {String} body 
 */
function parse_body(body) {

    // Try to replace all markdown images with plain url images
    try {
        let md_images = body.match(/!\[.*?\]\((.*?)\)/g); // Returns an array with markdown images

        // Replace image markdown with only urls
        md_images.map(image => {
            body = body.replace(image, image.match(/!\[.*?\]\((.*?)\)/)[1].replace(/\(/g, '%28').replace(/\)/g, '%29'));
        });
    } catch (e) { }

    // Try to replace all image tags with plain url image
    try {

        let images = body.match(/<img .*?>/g); // Returns an array with the images

        // Replace image tags with only urls
        images.map(image => {
            body = body.replace(image, image.match(/<img.*?src=['"](.*?)['"]/)[1].replace(/\(/g, '%28').replace(/\)/g, '%29'));
        });
    } catch (e) { }


    // Replace all images urls with image tag (Including IPFS images)
    body = body.replace(
        /https?:\/\/(?:[-a-zA-Z0-9._]*[-a-zA-Z0-9])(?::\d{2,5})?(?:[/?#](?:[^\s"'<>\][()]*[^\s"'<>\][().,])?(?:(?:\.(?:tiff?|jpe?g|gif|png|svg|ico)|ipfs\/[a-z\d]{40,})))/gi,
        '<img src="https://steemitimages.com/0x0/' + encodeURI('$&') + '" />');

    // Parse Steemit production links

    try {
        let images = body.match(
            /^(https?\:\/\/)?(www\.)?(steemit-production-imageproxy-thumbnail.s3.amazonaws\.com)\/[a-zA-Z0-9_.-]*/gmi
        );
        if (images !== null) {
            images.map(image => {
                body = body.replace(image, '<img src="https://steemitimages.com/0x0/' + encodeURI('$&') + '" />')
            });
        }
    } catch(e) { console.log(e)}

    return body;
}

/**
 * Method to generate JSON for error
 * @param {Number} code 
 * @param {String} msg 
 * @param {String} type
 */
function _prepare_error(code, msg, type) {
    return {
        status: code,
        message: msg,
        type: type
    }
}

exports.get_top_likers = get_top_likers;
exports.is_post_voted = is_post_voted;
exports.get_body_image = get_body_image;
exports.get_body_video = get_body_videos;
exports.is_following = is_following;
exports.parse_body = parse_body;
exports._prepare_error = _prepare_error;
exports.parse_videos = parse_videos;