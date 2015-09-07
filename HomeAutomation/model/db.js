var mongoose = require('mongoose');
var config = require('../config');
var mongoServer = config.mongoServer;

mongoose.connect('mongodb://' + mongoServer + '/homeAutomation');