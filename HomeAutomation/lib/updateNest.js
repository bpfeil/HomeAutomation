var mongoose = require('mongoose'); //mongo connection
var logger = require('./logger');
var nestAccess = require('../model/nestAccess');
var nest = require('unofficial-nest-api');

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
		logger.info(nestUser);
		logger.info(nestPsw);
	    if (err) {
	    	console.log("LOGIN ERROR");
	        console.log(err.message);
	        process.exit(1);
	        return;
	    } else {
	    	console.log("login success!");
	    	callback(null, data);
	    }
	});
};

var getNestAwayStatus = function(callback){
	var NestAwayStatus;
	NestAwayStatus = nestLogin(nestUser,nestPsw, function (err, data){
		if (err){
			return ("Login Error");
		}
		else {
			var awayStatus;
			awayStatus = nest.fetchStatus(function(data) {
				var status;
				var id = nest.getStructureId();
		    	status = data.structure[id].away;
		    	console.log("Nest Status " + status);
		    	return status;
			});
			return awayStatus;
		}
		
	});
	console.log("Function Status " + NestAwayStatus);
	return NestAwayStatus;
};

getNestCred();


module.exports = {
		
		'getNestAwayStatus': getNestAwayStatus,

	getNestStatus: function(){
		//var data = nestLogin(nestUser, nestPsw); 
		nestLogin(nestUser,nestPsw, function (err, data){
			if (err) {
				console.error("Unable to login");
			} else {
				//console.log(data);
				
				
			}
		
		    
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
		});
	}

};