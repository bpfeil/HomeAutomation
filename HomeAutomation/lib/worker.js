var mongoose = require('mongoose');
var logger = require('../lib/logger');
var pushbullet = require('./pushBullet');
var updateNest = require('../lib/updateNest');
var watcher = require('../lib/oplog_Watcher');

var lastCommunication = new Date();
var lastAlert = new Date();
var arduinoConnected = "Unknown";

setInterval(function(){//After 300 seconds
	if ((new Date() - lastCommunication) > 300000){
		if ((new Date() - lastAlert) > 300000){
			arduinoConnected = false;
			pushbullet.pushNote("Arduino Lost", "Connection", "Arduino lost at " + lastCommunication);
			lastAlert = new Date();
		}
	}
}, 5000);

module.exports = {
	arduinoWatcher: function(hostname){
		logger.debug(hostname);
		if (hostname == "GarageArduino"){
			lastCommunication = new Date();
			arduinoConnected = true;
		}
		
		else{
			logger.warn("Recieved a door post that wasn't from the GarageArduino");
		}
	},
	
	home: function(status, callback){
		mongoose.model('Home').count({}, function(err,count){
			if (err) {
		          logger.error(err);
		     } else {
		    	 //Need to fix this section.  When no one is home or just one person is home the check in/out still happens
		    	if(count === 0){
		    		if(status == "checkout"){
		    			 updateNest.setNestAwayStatus("away", function(response){
		    				 logger.info(response);
		    			 });
		    		 }
		    	}
		    	if(count === 1){
		    		if (status == "checkin"){
		    	    	updateNest.setNestAwayStatus("home",function(response){
		    	    		logger.info(response);
		    	    	});
		    	    }
		    	 }
		     }
		});
	},
	
	updateGarageSettings: function(key, value, callback){
		var data = {};
		data[key] = value;
		mongoose.model('GarageSettings').findOneAndUpdate(
			{},
			data,
	    function (err, success) {
	          if (err) {
	        	  logger.error("There was an error updating the GarageSettings DB");
	        	  logger.error(err);
	          } else {
	        	  return callback("Updated DB for " + key + " with a value of " + value);
	          }
			});
	},
	
	exposedArduinoState: function(callback){
		callback(arduinoConnected);
	},
	
	exposedDoorState: function(callback){
		watcher.exposedDoorState(function(state){
			if (state == "Unknown"){
				mongoose.model('DoorState').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, doorState) {
			         if (err) {
			             logger.error(err);
			             return callback(state);
			         } else {
			        	 return callback(doorState.state);
			         }
				});
			}
			else {
				return callback(state);
			}	
		});
	},
	
	lastDoorActivity: function(callback){
		watcher.exposedDoorActivityTime(function(time){
			if (time == "Unknown"){
				mongoose.model('DoorState').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, doorState) {
			         if (err) {
			             logger.error(err);
			             return callback(doorState);
			         } else {
			        	 return callback(doorState.timeStamp.toLocaleString());
			         }
				});
			}
			else {
				return callback(time.toLocaleString());
			}
		});
	},
};
