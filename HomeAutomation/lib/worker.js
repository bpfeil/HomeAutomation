var mongoose = require('mongoose');
var logger = require('../lib/logger');
var pushbullet = require('./pushBullet');
var updateNest = require('../lib/updateNest');

var lastCommunication = new Date();
var lastAlert = new Date();


var arduinoWatcher = function(hostname){
	logger.debug(hostname);
	if (hostname == "GarageArduino"){
		lastCommunication = new Date();
	}
	
	else{
		console.error("Hostname not what is expected!");
	}
	
	//lastCommunication = new Date();
};

var home = function(status, callback){
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
};

setInterval(function(){//After 300 seconds
	if ((new Date() - lastCommunication) > 300000){
		if ((new Date() - lastAlert) > 300000){
			pushbullet.pushNote("Arduino Lost", "Arduino Lost", "Arduino lost at " + lastCommunication);
			lastAlert = new Date();
		}
	}
}, 5000);


module.exports = {
	arduinoWatcher: arduinoWatcher,
	home: home,
};
