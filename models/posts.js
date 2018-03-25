var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Post = mongoose.model('Posts', new Schema(), 'Posts');

module.exports = Post;