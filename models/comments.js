var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Comments = mongoose.model('Comments', new Schema(), 'Comments');

module.exports = Comments;