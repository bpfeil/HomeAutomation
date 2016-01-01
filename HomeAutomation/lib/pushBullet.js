var PushBullet  = require('pushbullet');
var mongoose = require('mongoose'); //mongo connection
var logger = require('./logger');
var PB_DB = require('../model/pushBullet_DB');

var updateDevices = function(callback){ //get devices from PushBullet and log to local DB
	mongoose.model('PushBullet').find({},{}, { sort: { _id : -1}}, function(err,user){
	     if (err) {
	          logger.error(err);
	     } else {
	    	 user.forEach(function(item){
	    		 userData = item.toObject();
	    		 var user = userData.user;
	    		 var apiKey = userData.API_KEY;
	    		 
	    		 var pusher = new PushBullet(apiKey);
	    		 
	    		 pusher.devices(function(error, response){
	    			 if (error){
	    				 logger.error(error);
	    			 }
			         else {
			        	  //logger.info(response);
			        	  //mongoose.model('PushBullet').update({
			        	  mongoose.model('PushBullet').findOneAndUpdate({
			        		  user : user,
			        		  API_KEY : apiKey},
			                  {PB_Data : response},
			                  function (err, entry) {
			            	  if (err){
			            		  logger.error(err);
			            	  }else {
			            		  logger.info("Successfully upadated PushBullet data for " + user + "!");
			            	  }
			              });
			          }
			     });
	          });
	     }
	});
};

updateDevices();

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
			var Title = App + " " + title;
			mongoose.model('PushBullet').find({},{}, { sort: { _id : -1}}, function(err,users){
				if (err) {
					logger.error(err);
				} else {
					logger.info("Sending alert of " + title);
					users.forEach(function(item){
						userData = item.toObject();
						var apiKey = userData.API_KEY;
						var pusher = new PushBullet(apiKey);
						var user = userData.user;
						userData.PB_Data.devices.forEach(function(device){
							if (device.pushable === true && device.type != "chrome"){
								pusher.note(device.iden, Title, body, function(error, response) {
									if (error){
										logger.error("Error on device: " + device.nickname);
										logger.error(error);
									}
									else {
										logger.info("Pushbullet was successful");
										logger.info("Pushed note to " + user/*userData.user*/ + "'s " + device.nickname);
									}
								});
							}
						});
					});
				}
			});
		},
		
		updateDevices: updateDevices,
};