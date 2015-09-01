var PushBullet  = require('pushbullet');
var mongoose = require('mongoose'); //mongo connection
var config = require('../config');
var pushBulletAPIKey  = "v1RJ3nYowphlpDBnlDmr1BcUIwsWTEPYwfujEQA2e50Lc";
var pusher = new PushBullet(pushBulletAPIKey);
var logger = require('./logger');
var PB_DB = require('../model/pushBullet_DB');

module.exports = {
		getDevices: function getDevices(callback){
		     pusher.devices(function(error, response){
		          if (error){
		               logger.error(error);
		          }
		          else {
		        	  logger.info(response);
		        	  mongoose.model('PushBullet').create({
		                  PB_Data : response
		              }, function (err, entry) {
		            	  if (err){
		            		  logger.error(err);
		            	  }else {
		            		  logger.info("Success!");
		            	  }
		              });
		        	  var devices = [];
		               for (i = 0; i < response.devices.length; i++){
		                    devices[i] = response.devices[i];
		                    //logger.info(devices[i].nickname + ' - ' + devices[i].iden);
		               }
		          }
		     });
		},

		pushNote: function pushNote(device, title, body, callback){
		     var iden, nickname;
		     var Title = App + " " + title;
		     for (i = 0; i < device.length; i++){
		          iden = device[i].iden;
		          nickname = device[i].nickname;

		          pusher.note(iden, Title, body, function(error, response) {
		               if (error){
		                    logger.error(error);
		               }
		               else {
		                    logger.info("Pushbullet was successful");
		                    //logger.debug(response);
		               }
		          });
		          logger.info("Pushed note to " + nickname);
		     }
		}
		
};