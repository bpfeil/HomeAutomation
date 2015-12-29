var pushbullet = require('./lib/pushBullet');
var PB_DB = require('./model/pushBullet_DB');
var db = require('./model/db');
var mongoose = require('mongoose'); //mongo connection

mongoose.model('PushBullet').find({},{}, { sort: { _id : -1}}, function(err,devices){
	if (err) {
		logger.error(err);
	} else {
		devices.forEach(function(item){
			userData = item.toObject();
			//console.log(userData.user);
			var apiKey = userData.API_KEY;
			var user = userData.user;


			pushbullet.getDevices(user,apiKey);
		})
	}
})
