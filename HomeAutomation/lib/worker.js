var mongoose = require('mongoose');
var logger = require('../lib/logger');
var pushbullet = require('./pushBullet');
var updateNest = require('../lib/updateNest');
var watcher = require('../lib/oplog_Watcher');

var lastCommunication = new Date();
var lastAlert = new Date();
var arduinoConnected = "Unknown";
var arduino = "Unknown";

mongoose.model('GarageSettings').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, settings) {
    if (err) {
    	logger.error("Unable to get settings from DB");
    } else {
    	arduino = settings.arduinoEnabled;
    	if (arduino === false){
    		arduinoConnected = "Disabled";
    	}
    }
});

setInterval(function(){//After 300 seconds
	if (arduino){
		if ((new Date() - lastCommunication) > 300000){
			if ((new Date() - lastAlert) > 300000){
				console.log(arduino);
				console.log("Arduino Enabled = " + arduino);
				arduinoConnected = false;
				pushbullet.pushNote("Arduino Lost", "Connection", "Arduino lost at " + lastCommunication);
				lastAlert = new Date();
			}
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
	        	  if (key == "arduinoEnabled"){
	        		  arduino = value;
	        		  lastAlert = new Date();
	        	  }
	        	  return callback("Updated DB for " + key + " with a value of " + value);
	          }
			});
	},
	
	exposedArduinoState: function(callback){
		callback(arduinoConnected);
	},
	
	openingMethod: function(callback){
		mongoose.model('GarageSettings').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, settings) {
		    if (err) {
		    	logger.error("Unable to get settings from DB");
		    	callback("We have an issue getting to the database");
		    } else {
		    	//values.push({arduino: settings.arduinoEnabled, myQ: settings.myQ});
		    	callback(null, JSON.stringify({arduino: settings.arduinoEnabled, myQ: settings.myQ}));
		    }
		});
	},
	
	exposedDoorState: function(callback){
		watcher.exposedDoorState(function(state){
			if (state == "Unknown"){
				mongoose.model('DoorState').findOne({}, {}, { sort: { _id : -1 } }, function (err, doorState) {
			         if (err) {
			             logger.error(err);
			             return callback(state);
			         } else {
			        	 if (doorState){
			        		 return callback(doorState.state);
			        	 }
			        	 else{
			        		 logger.debug("Nothing found to return");
			        		 return callback("none");
			        	 }
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
			             return callback(time);
			         } else {
			        	 if(doorState){
			        		 return callback(doorState.timeStamp.toLocaleString());
			        	 }
			        	 else{
			        		 logger.debug("nothing found to return");
			        		 return callback('1-1-1900');
			        	 }
			         }
				});
			}
			else {
				return callback(time.toLocaleString());
			}
		});
	},
};
