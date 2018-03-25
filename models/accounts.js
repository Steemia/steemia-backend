var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Accounts = mongoose.model('Accounts', new Schema(), 'Accounts');

module.exports = Accounts;