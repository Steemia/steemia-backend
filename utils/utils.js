var exports = module.exports = {};

// Templates for trending
const S_trending = 10000000;
const T_trending = 480000;

// Templates for hot
const S_hot = 10000000;
const T_hot = 10000;

function caculate_score(v_shares, created, S, T) {

    //created = new Date(created).getTime() / 1000;
    var mod_score = v_shares / S;

    var order = Math.log10(Math.abs(mod_score));

    let sign = 0;

    if (mod_score > 0) sign = 1;
    else if (mod_score < 0) sign = -1

    return sign * order + parseFloat(created / parseFloat(T));

}

var calculate_hot = function calculate_hot(v_shares, created) {
    return caculate_score(v_shares, created, S_hot, T_hot);
}

var calculate_trending = function calculate_trending(v_shares, created) {
    return caculate_score(v_shares, created, S_trending, T_trending);
}

var seven_days_ago = function seven_days_ago() {
    var days = 7;
    var date = new Date();
    var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
    return last;
}

exports.calculate_hot = calculate_hot;
exports.caculate_trending = calculate_trending;
exports.seven_days_ago = seven_days_ago;
