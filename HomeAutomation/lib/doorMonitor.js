//var config = require('../config');
var logger = require('./logger');
var pushbullet = require('./pushBullet');
var mongoose = require('mongoose'); //mongo connection

var notifyTime, alerts, alertTime;
var lastDoorStateChange = new Date();
var currentDoorState = {};
var lastAlert = new Date();

var getSettings = function(){
	//get settings from DB
	mongoose.model('GarageSettings').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, settings) {
	    if (err) {
	    	logger.error("Unable to get settings from DB");
	    } else {
	    	notifyTime = settings.notifyTime;
	    	alertTime = notifyTime * 60 * 1000;
	    	alerts = settings.alerts;
	    	logger.info("doorMonitor settings updated");
	    }
	});
};

getSettings();

//get last doorState change from DB
mongoose.model('DoorState').findOne({}, {}, { sort: { _id : -1 } }, function (err, lastState) {
	if (err) {
		logger.error(err);
	} else {
		if (lastState){
			console.log(lastState);
			door = lastState.door;
			currentDoorState[door] = lastState.state;
			mongoose.model('DoorState').findOne({"state": {$ne: currentDoorState[door]}},{}, { sort: { _id : -1}}, function(err,lastChange){
				if (err) {
					logger.error(err);
				}
				else{
					if (lastChange){
						console.log(lastChange);
						lastDoorStateChange = lastChange.timeStamp;
						console.log(lastDoorStateChange);
					}
					else{
						lastDoorStateChange = lastState.timeStamp;
					}
				}
			});
		}
		else{
			logger.debug("No state found");
			lastDoorStateChange = "1-1-1900";
		}
	}
});

module.exports = {
	doorAlert: function doorStateAlert(door, doorState){
		var action, desc;
		now = new Date();
		console.log(currentDoorState);
		if (doorState != currentDoorState[door]){
			if (currentDoorState[door] == "Closed"){
				action = "Opening";
			}
			/*else if(currentDoorState == "Open"){
				action = "Closing";
			}
			else if (currentDoorState == "Moving"){
				action = doorState;
			}*/
			if (currentDoorState[door] == "Closed"){
				desc = "Door changed from " + currentDoorState[door] + " to " + doorState;
				pushbullet.pushNote("Garage Door", action, desc);
				logger.debug("Resetting doorstate from " + currentDoorState[door] + " to " + doorState);
				
			}
			
			currentDoorState[door] = doorState;
			
			lastDoorStateChange = new Date();
		}
		else{
		    if (doorState == "Unknown" || doorState == "Moving"|| doorState == "Open"){
		    	if (now - lastAlert > alertTime && alertTime > 0){
		    		var event = "!**" + doorState + "**!";
		            desc = "Door " + doorState + " for over ";
		            var time = now - lastDoorStateChange;
		            var hrs = Math.floor(time/(60*60*1000));
		            var mins = Math.floor(time/(60*1000));
		            if (hrs >= 1){
		            	mins = mins - (60 * hrs);
		                desc = desc + hrs + " hours " + mins + " minutes";
		            }
		            else {
		               desc = desc + mins + " minutes";
		            }
		            if (mins > 20){
		            	Priority = 1;
		                option = doorState;
		            }
		            else {
		            	Priority = 0;
		                option = "";
		            }
		            if (alerts === true){
		            	pushbullet.pushNote("Garage Door", event, desc);
		            }
		            lastAlert = new Date();
		            logger.debug('Updated last alert');
		    	}
		    }
		}
	},
	
	getSettings: getSettings
};