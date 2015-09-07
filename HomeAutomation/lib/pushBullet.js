var PushBullet  = require('pushbullet');
var mongoose = require('mongoose'); //mongo connection
var logger = require('./logger');
var PB_DB = require('../model/pushBullet_DB');

module.exports = {
		getDevices: function getDevices(user, api, callback){ //get devices from PushBullet and log to local DB
			var pusher = new PushBullet(api);
		     pusher.devices(function(error, response){
		          if (error){
		               logger.error(error);
		          }
		          else {
		        	  logger.info(response);
		        	  mongoose.model('PushBullet').create({
		        		  user : user,
		        		  API_KEY : api,
		                  PB_Data : response
		              }, function (err, entry) {
		            	  if (err){
		            		  logger.error(err);
		            	  }else {
		            		  logger.info("Successfully added " + user + "!");
		            	  }
		              });
		          }
		     });
		},

		pushNote: function pushNote(App, title, body, callback){  //Take out devices,  need to pull these in the beginning from DB
			mongoose.model('PushBullet').find({},{}, { sort: { _id : -1}}, function(err,devices){
				if (err) {
					logger.error(err);
				} else {
					devices.forEach(function(item){
						userData = item.toObject();
						console.log(userData.user);
						var apiKey = userData.API_KEY;
						var pusher = new PushBullet(apiKey);
						console.log(userData.PB_Data.devices);
						userData.PB_Data.devices.forEach(function(device){
							if (device.pushable === true && device.type != "chrome"){
								var Title = App + " " + title;
								pusher.note(device.iden, Title, body, function(error, response) {
									if (error){
										logger.error(error);
									}
									else {
										console.log("success");
										logger.info("Pushbullet was successful");
										//logger.debug(response);
									}
								});
								logger.info("Pushed note to " + userData.user + "'s " + device.nickname);
							}
						});
					});
				}
			});
		}
		
};