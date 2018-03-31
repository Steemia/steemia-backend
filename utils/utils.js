var exports = module.exports = {};

// Templates for trending
const S_trending = 10000000;
const T_trending = 480000;

// Templates for hot
const S_hot = 10000000;
const T_hot = 10000;

function caculate_score(v_shares, created, S, T) {

    let mod_score = v_shares / S;

    let order = Math.log10(Math.max(Math.abs(mod_score), 1));

    let sign = 0;

    if (mod_score > 0) sign = 1;
    else if (mod_score < 0) sign = -1

    return sign * order + parseFloat(created / parseFloat(T));

}

let calculate_hot = function calculate_hot(v_shares, created) {
    return caculate_score(v_shares, created, S_hot, T_hot);
}

let calculate_trending = function calculate_trending(v_shares, created) {
    return caculate_score(v_shares, created, S_trending, T_trending);
}

let reputation = function reputation(reputation) {
    if (reputation == null) return reputation;
      reputation = parseInt(reputation);
      let rep = String(reputation);
      const neg = rep.charAt(0) === "-";
      rep = neg ? rep.substring(1) : rep;
      const str = rep;
      const leadingDigits = parseInt(str.substring(0, 4));
      const log = Math.log(leadingDigits) / Math.log(10);
      const n = str.length - 1;
      let out = n + (log - parseInt(log));
      if (isNaN(out)) out = 0;
      out = Math.max(out - 9, 0);
      out = (neg ? -1 : 1) * out;
      out = out * 9 + 25;
      out = parseInt(out);
      return out;
}

exports.calculate_hot = calculate_hot;
exports.caculate_trending = calculate_trending;
exports.reputation = reputation;