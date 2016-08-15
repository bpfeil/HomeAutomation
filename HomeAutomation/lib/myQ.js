var mongoose = require('mongoose'); //mongo connection
var logger = require('./logger');
var myQ = require('myqnode').myQ;
var Promise = require('es6-promise').Promise;
var myQ_Access = require('../model/myQ_Access');
var myQ_Devices = require('../model/myQ_Devices');
var pushBullet = require('../lib/pushBullet');
var time = require('../lib/time');

var db = require('../model/db');

var myQ_Usr, myQ_Psw;

var garageDoorType = "47";


var get_MyQ_Cred = function(){
	mongoose.model('MyQ_Access').findOne({},{}, { sort: { _id : -1}}, function(err, data){
	     if (err) {
	         logger.error("Unable to get nest credentials from DB"); 
	    	 logger.error(err);
	     } else {
	    	 myQ_Usr = data.user;
	         myQ_Psw = data.password;
	     }
	});
};

var updateDevices = function(callback){ //get devices from PushBullet and log to local DB
	mongoose.model('MyQ_Access').find({},{}, { sort: { _id : -1}}, function(err,record){
	     if (err) {
	          logger.error(err);
	     } else {
	    	 record.forEach(function(user){
	    		 var usr = user.user;
	    		 var psw = user.password;
	    		 
	    		 getDevices(usr, psw, function(err, devices){
	    	          if (err) {
	    	               logger.error("Error " + err);
	    	          }else {
	    	               devices.forEach(function(device){
	    	                    getDeviceID(device, function(err, deviceId){
	    	                         if (err){
	    	                              logger.error(err);
	    	                         }else {
	    	                              if (deviceId != "none"){
	    	                            	  getDeviceName(device, function(err, name){
	    	                            		  if (err){
	    	                            			  logger.error(err);
	    	                            		  }else {
		    	                            		  //mongoose.model('MyQ_Devices').create({
		    	                            		  mongoose.model('MyQ_Devices').findOneAndUpdate({
		    	            			        		  user : usr,
		    	            			        		  deviceID: deviceId,
		    	            			                  deviceName: name},
		    	            			                  function (err, entry) {
		    	            			            	  if (err){
		    	            			            		  logger.error(err);
		    	            			            	  }else {
		    	            			            		  logger.info("Successfully upadated MyQ data for " + usr + "!");
		    	            			            	  }
		    	            			              });
	    	                            		  }
	    	                            	  });
	    	                              }
	    	                         }
	    	                    });
	    	               });
	    	          }
	    		 });
	    	 });
	     }
	});
};

var getDevices = function(callback){
	var Devices = [];
     myQ.getDevices(myQ_Usr, myQ_Psw)
          .then(function(respObj){
          for (var device in respObj.Devices){
               Devices.push(respObj.Devices[device]);
          }
          callback(null,Devices);
     },
     function(respObj){
          logger.error("Error executing method "+respObj);
          callback(respObj);
          }
     );
};

var getDeviceID = function(device, callback){
	logger.info(device.TypeId + " " + device.MyQDeviceTypeName + " " + device.DeviceName);
    if (device.TypeId == garageDoorType){
         device.Attributes.forEach(function(attribute){
              if (attribute.AttributeId == "527"){
                    callback(null,device.DeviceId);
              }
         });
    }
    else {
        callback(null, "none");
    }
};

var getDeviceName = function(device, callback){
    device.Attributes.forEach(function(attribute){
    	if (attribute.AttributeId == "527"){
    		//console.log(attribute.Value);
    		callback(null, attribute.Value);
    	}
    });
    callback("No name found");
};


var openDoor = function(deviceId, callback){
	logger.info("opening");
     myQ.openDoor(myQ_Usr, myQ_Psw, deviceId)
        .then(function(state){
               logger.info("Sucessfully Opened Door " + state);
               desc = "Door Triggered @ \n" + time.getDateTime1(new Date());
				pushBullet.pushNote("Garage Door", "Door Triggered", desc);
               callback(null, state);
        },
            function(state){
               logger.error("Error Opening Door " + state);
               pushBullet.pushNote("Door Not Triggered", "Door not triggered due to an error");
               callback("error opening");
        }
         );
   };
   
var closeDoor = function(deviceId, callback){
	logger.info("closing");
     myQ.closeDoor(myQ_Usr, myQ_Psw, deviceId)
        .then(function(state){
               logger.info("Sucessfully Closed Door " + state);
               desc = "Door Triggered @ \n" + time.getDateTime1(new Date());
               pushBullet.pushNote("Garage Door", "Door Triggered", desc);
               callback(null, state);
        },
            function(state){
               logger.error("Error Closing Door " + state);
               pushBullet.pushNote("Door Not Triggered", "Door not triggered due to an error");
               callback("error closing");
        }
         );
   };
   
var triggerDoor = function(callback) {
	mongoose.model('MyQ_Devices').find({},{}, { sort: { _id : -1}}, function(err, data){
	     if (err) {
	         logger.error("Unable to get devices from DB"); 
	    	 logger.error(err);
	     } else {
	    	 data.forEach(function(device){
	    		if (device.deviceName == "Main Garage Door"){
	    			getDoorStatus(device.deviceID, function(err, door){
	    				if (err) {
	    		               logger.error("Error " + err);
	    		          } else {
	    		               logger.info("Door is currently " + door);
	    		               if (door == "Open"){ 
	    		                    //Close door
	    		                    closeDoor(device.deviceID, function(err, success){
	    		                    	if (err){
	    		                    		logger.error(err);
	    		                    	}else{
	    		                    		callback(null, "closing");
	    		                    	}
	    		                    });
	    		               }
	    		               else if (door == "Closed") { 
	    		                    //Open door
	    		            	   openDoor(device.deviceID, function(err, success){
	    		                    	if (err){
	    		                    		logger.error(err);
	    		                    	}else{
	    		                    		callback(null, "opening");
	    		                    	}
	    		                    });
	    		               }
	    		          }
	    			});
	    		} 
	    	 });
	     }
	});
};
      

var getDoorStatus = function(deviceId, callback){
   myQ.getDoorStatus(myQ_Usr, myQ_Psw, deviceId)
          .then(function(state){
               callback(null, state);
          },
               function(state){
                    callback(state);
               }
          );
};


var getState = function(device, callback){
     //1 = open, 2 = closed, 4 = opening, 5 = closing
     doorstates = ["Undefined","Open","Closed","Undefined","Opening","Closing"]; // 1= Open, 2=Closed, 4=Opening, 5=Closing
     if (device.TypeId == garageDoorType){
          device.Attributes.forEach(function(attribute){
               if (attribute.AttributeId == "536"){
                    state = doorstates[attribute.Value];
                    callback(null, state);
               }
          });
     }
     else {
          callback(null, "No state Found");
     }
};

var getDoorStatuses = function(callback){
	status = [];
     getDevices(function(err, Devices){
          if (err) {
        	  logger.error("Error " + err);
          }else {
              Devices.forEach(function(device){
                    getDeviceID(device, function(err, deviceId, name){
                         if (err){
                              logger.error(err);
                         }else {
                              if (deviceId != "none"){
                            	  getDeviceName(device, function(err, name){
                            		  if (err){
                            			  logger.error(err);
                            		  }else {
                            			  getState(device, function(err, state){
                            				  if (err){
                            					  logger.error(err);
                            				  }else {
                            					  //console.log(device);
                                    			  console.log(name + " is currently " + state);
                                    			  status.push({name: state});
                                    			  //Get all devices and states and return json
                            				  }
                            				  callback(JSON.stringify(status));
                                		  });
                            		  }
                            	  });
                              }
                         }
                    });
               });
          }
     });
};

var triggerDoor1 = function(){
     getDevices(function(err, data){
          if (err) {
        	  logger.error("Error " + err);
          }else {
               Devices.forEach(function(device){
                    getDeviceID(device, function(err, deviceId){
                         if (err){
                        	 logger.error(err);
                         }else {
                              if (deviceId != "none"){
                                   logger.info(deviceId);
                                   triggerDoor(myQ_Usr, myQ_Psw, deviceId, function(err, data){
                                        if (err) {
                                        	logger.error("Error " + err);
                                        } else {
                                             logger.info("Door is currently " + data);
                                        }
                                   });
                              }
                         }
                    });
               });
          }
     });
};

get_MyQ_Cred();


module.exports = {
		
	updateMyQDevices: updateDevices,
	
	getDoorStates: getDoorStatuses,
	
	triggerDoor: triggerDoor

};
