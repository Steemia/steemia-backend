// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// the schema is useless so far
// we need to create a model using it
var Post = mongoose.model('Posts', new Schema(), 'Posts');

// make this available to our users in our Node applications
module.exports = Post;