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
		    	if (status === false){
		    		status = "Home";
		    	}
		    	else if (status === true){
		    		status = "Away";
		    	}
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

var getHouseTemp = function(data, callback){
	nest.fetchStatus(function(data) {
		for (var deviceId in data.device) {
			if (data.device.hasOwnProperty(deviceId)) {
				//console.log(nest.ctof(data.shared[deviceId].current_temperature));
				return callback(nest.ctof(data.shared[deviceId].current_temperature));
			}
		}
	});
};

var getSetTemp = function(data, callback){
	nest.fetchStatus(function(data) {
		for (var deviceId in data.device) {
			if (data.device.hasOwnProperty(deviceId)) {
				//console.log(nest.ctof(data.shared[deviceId].target_temperature));
				return callback(nest.ctof(data.shared[deviceId].target_temperature));
			}
		}
	});
};

var getHouseHumidity = function(data, callback){
	nest.fetchStatus(function(data) {
		for (var deviceId in data.device) {
			if (data.device.hasOwnProperty(deviceId)) {
				//console.log(data.device[deviceId].current_humidity);
				return callback(data.device[deviceId].current_humidity);
			}
		}
	});
};

var getHouseData = function(callback){
	var currentTemp, currentSetTemp, currentHumidity, homeStatus;
	
	nestLogin(nestUser,nestPsw, function (err, data){
		if (err) {
			return ("Login Error");
		}
		else {
			getHouseTemp(data,function(temp){
				currentTemp = temp;
				console.log(currentTemp);
				getSetTemp(data, function(setTemp){
					currentSetTemp = setTemp;
					console.log(setTemp);
					getHouseHumidity(data, function(humidity){
						currentHumidity = humidity;
						console.log(humidity);
						getNestAwayStatus(function(status){
							homeStatus = status;
							console.log(homeStatus);
							callbackString = JSON.stringify({"Current_Temp": currentTemp, "Nest_Set_Temp": currentSetTemp, "Current_Humidity": currentHumidity, "Home_Status": homeStatus});
							//console.log(JSON.stringify({"Humidity" : data.device[deviceId].current_humidity}));
							//return callback(currentTemp, currentSetTemp, currentHumidity, homeStatus);
							return callback(callbackString);
						});
					});
				});
			});
		}
	});
};

getNestCred();


module.exports = {
		
	getNestAwayStatus: getNestAwayStatus,
	
	setNestAwayStatus: setNestAwayStatus,
	
	getHouseData: getHouseData,
	
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