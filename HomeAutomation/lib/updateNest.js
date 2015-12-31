var mongoose = require('mongoose'); //mongo connection
var logger = require('./logger');
var nestAccess = require('../model/nestAccess');
var nest = require('unofficial-nest-api');
var pushbullet = require('./pushBullet');

var nestUser, nestPsw;

var getNestCred = function(){
	mongoose.model('NestAccess').findOne({},{}, { sort: { _id : -1}}, function(err, data){
	     if (err) {
	         logger.error("Unable to get credentials from DB"); 
	    	 logger.error(err);
	     } else {
	    	 nestUser = data.nestUser;
	         nestPsw = data.nestPSW;
	     }
	});
};

var nestLogin = function(nestUser, nestPsw, callback){
	nest.login(nestUser, nestPsw, function (err, data) {
		//logger.info(nestUser);
		//logger.info(nestPsw);
	    if (err) {
	    	logger.error("LOGIN ERROR");
	        logger.error(err.message);
	        process.exit(1);
	        return;
	    } else {
	    	logger.debug("login success!");
	    	callback(null, data);
	    }
	});
};

var getNestAwayStatus = function(callback){
	nestLogin(nestUser,nestPsw, function (err, data){
		if (err){
			return ("Login Error");
		}
		else {
			nest.fetchStatus(function(data) {
				var status;
				var id = nest.getStructureId();
		    	status = data.structure[id].away;
		    	//console.log("Nest Status " + status);
		    	return callback(status);
			});
		}
	});
};

var setNestAwayStatus = function(state, callback){
	nestLogin(nestUser,nestPsw, function (err, data){
		if (err){
			return ("Login Error");
		}
		else {
			nest.fetchStatus(function(data) {
				for (var deviceId in data.device) {
				    if (data.device.hasOwnProperty(deviceId)) {
				        var device = data.shared[deviceId];
				        if (state == "home"){
				        	nest.setHome();
				        	callback("Home set successfully");
				        	pushbullet.pushNote("Home!", "Nest is set to home", "Nest has been set to home");
				        	
				        }
				        else if (state == "away"){
				        	nest.setAway();
				        	callback("Away set successfully");
				        	pushbullet.pushNote("Aaway!", "Nest is set to away", "Nest has been set to away");
				        }
				        else {
				        	logger.error("State improperly passed");
				        }
				    }
			    }
			});
		}
	});
};

getNestCred();


module.exports = {
		
	getNestAwayStatus: getNestAwayStatus,
	
	setNestAwayStatus: setNestAwayStatus,
	
	/*for (var key in structure){
	console.log(key);
}*/

/*for (var structure in data.structure){
	if(data.structure.hasOwnProperty(away)){
		var status = data.structure.hasOwnProperty(away);
		logger.debug(status);
	}
}*/

/*for (var deviceId in data.device) {
    if (data.device.hasOwnProperty(deviceId)) {
    	logger.info(deviceId);
        var device = data.shared[deviceId];
        logger.info(device);
        // here's the device and ID
        //nest.setTemperature(deviceId, nest.ftoc(70));
        nest.setHome();
        //nest.setAway();
        
    }
}*/


};