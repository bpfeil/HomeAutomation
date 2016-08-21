var mongoose = require('mongoose');
var logger = require('../lib/logger');
var pushbullet = require('./pushBullet');
var updateNest = require('../lib/updateNest');
var watcher = require('../lib/oplog_Watcher');
var ecobee = require('./ecobee');

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

var thermoMethod = function(callback){
	mongoose.model('Settings').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, settings) {
	    if (err) {
	    	logger.error("Unable to get settings from DB");
	    	callback("We have an issue getting to the database");
	    } else {
	    	//values.push({arduino: settings.arduinoEnabled, myQ: settings.myQ});
	    	callback(null, JSON.stringify({nest: settings.nest, ecobee: settings.ecobee}));
	    }
	});
};

module.exports = {
	arduinoWatcher: function(hostname){
		logger.debug(hostname);
		if (hostname == "GarageArduino"){
			lastCommunication = new Date();
			arduinoConnected = true;
		}
		if (hostname == "HomeAutomation - MyQ"){
			logger.info("Recieved a door post from MyQ");
		}
		else{
			logger.warn("Recieved a door post that wasn't from the GarageArduino");
		}
	},
	
	home: function(status, callback){
		thermoMethod(function(err, values){
			if (err){
				logger.err(err);
			}
			else {
				values = JSON.parse(values);
				ecobee = values.ecobee;
				nest = values.nest;
				mongoose.model('Home').count({}, function(err,count){
					if (err) {
				          logger.error(err);
				     } else {
				    	 //Need to fix this section.  When no one is home or just one person is home the check in/out still happens
				    	if(count === 0){
				    		if(status == "checkout"){
				    			if (nest){
				    				updateNest.setNestAwayStatus("away", function(response){
					    				 logger.info(response);
					    			 });
				    			}
				    			if (ecobee){
				    				console.log("Ecobee checkout function TBD");
				    			}
				    		 }
				    	}
				    	if(count === 1){
				    		if (status == "checkin"){
				    			console.log(nest);
				    			console.log(ecobee);
				    			if (nest){
				    				updateNest.setNestAwayStatus("home",function(response){
					    	    		logger.info(response);
					    	    	});
				    			}
				    			if (ecobee){
				    				console.log("Ecobee checkin function TBD");
				    			}
				    	    }
				    	 }
				     }
				});
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
	
	updateSettings: function(key, value, callback){
		var data = {};
		data[key] = value;
		mongoose.model('Settings').findOneAndUpdate(
			{},
			data,
	    function (err, success) {
	          if (err) {
	        	  logger.error("There was an error updating the Settings DB");
	        	  logger.error(err);
	          } else {
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
	
	exposedDoorState: function(door, callback){
		mongoose.model('DoorState').findOne({door: door}, {}, { sort: { _id : -1 } }, function (err, doorState) {
			if (err) {
				logger.error(err);
				return callback("Unknown due to error");
			} else {
				if (doorState){
					return callback(doorState.state);
				}else{
					logger.debug("Nothing found to return");
					return callback("none");
				}
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
	
	thermoMethod: thermoMethod
};
