var mongoose = require('mongoose'); // mongo connection
var logger = require('./logger');
var myQ = require('myq-api');
var Promise = require('es6-promise').Promise;
var myQ_Access = require('../model/myQ_Access');
var myQ_Devices = require('../model/myQ_Devices');
var pushBullet = require('../lib/pushBullet');
var time = require('../lib/time');

var db = require('../model/db');

var myQ_Usr, myQ_Psw;
var token, account;

var garageDoorType = "2";

var get_MyQ_Cred = function(){
	mongoose.model('MyQ_Access').findOne({},{}, { sort: { _id : -1}}, function(err, data){
	     if (err) {
	         logger.error("Unable to get nest credentials from DB"); 
	    	 logger.error(err);
	     } else {
	    	 myQ_Usr = data.user;
	         myQ_Psw = data.password;
	         console.log("myQ credentials grabbed from DB");
	     }
	});
};

var login = function(callback) {
	
	account = new myQ(myQ_Usr, myQ_Psw)
    account.login()
    	.then(function (result) {
    		if (result.returnCode == "0"){
    			token = result.token;
        		console.log('MyQ Login Successful');
        		callback(null, account);
    		}else {
    			callback("Unsuccessful Login");
    		}
    		
    	}).catch(function (err) {
    		logger.error(err);
    		callback(err);
    	});
};

var updateDevices = function(callback){ // get devices from MyQ and log to local DB
	getDevices(function(err, devices){
		if (err) {
			logger.error("Error " + err);
		}else {
			console.log(devices);
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
										// mongoose.model('MyQ_Devices').create({
										mongoose.model('MyQ_Devices').findOneAndUpdate({
											user: myQ_Usr,
											deviceName: name},
		    	            			    {deviceID: deviceId},
		    	            			    {upsert: 'True'},
		    	            			    function (err, entry) {
		    	            			    	if (err){
		    	            			    		logger.error(err);
		    	            			    		}else {
		    	            			    			logger.info("Successfully upadated MyQ data for " + myQ_Usr + " device " + name + "!");
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
};

var getDevices = function(callback){
	var Devices = [];
	login(function(err, account){
		 account.getDevices([1,2,3,5,7,9,13,15,16,17])
          .then(function(respObj){
        	  console.log(respObj.devices);
        	  for (i = 0; i < respObj.devices.length; i++){
        		  // console.log(respObj.devices[i]);
        		  Devices.push(respObj.devices[i]);
        	  }
        	  callback(null,Devices);
          },
     function(respObj){
          logger.error("Error executing method "+respObj);
          callback(respObj);
          }
     );
	})
};

var getDeviceID = function(device, callback){
	logger.info(device.typeId + " " + device.name + " " + device.id);
    if (device.typeId == garageDoorType){
    	callback(null,device.id);
    }
    else {
        callback(null, "none");
    }
};

var getDeviceName = function(device, callback){
	if (device.name){
		callback(null, device.name);
	}
	else {
		callback("No name found");
	}
};


var openDoor = function(account, deviceId, callback){
	logger.info("opening");
	account.setDoorState(deviceId, 1)
	  .then(function (result) {
		  logger.info("Sucessfully Opened Door " + result);
          desc = "Door Triggered @ \n" + time.getDateTime1(new Date());
          pushBullet.pushNote("Garage Door", "Door Triggered", desc);
          callback(null, result);
	  }).catch(function (err) {
		  logger.error("Error Opening Door " + result);
          pushBullet.pushNote("Door Not Triggered", "Door not triggered due to an error");
          callback("error opening");
	  });
  };
   
var closeDoor = function(account, deviceId, callback){
	logger.info("closing");
	account.setDoorState(deviceId, 0)
	  .then(function (result) {
		  logger.info("Sucessfully Closed Door " + result);
          desc = "Door Triggered @ \n" + time.getDateTime1(new Date());
          pushBullet.pushNote("Garage Door", "Door Triggered", desc);
          callback(null, result);
	  }).catch(function (err) {
		  logger.error("Error Closing Door " + result);
          pushBullet.pushNote("Door Not Triggered", "Door not triggered due to an error");
          callback("error closing");
	  });
};

var triggerDoor = function(callback) {
	getMyQDevices(function(err, data){
		if (err){
			console.log(err);
		}
		else {
	    	 login(function(err, account){
					if (err){
						logger.error("Unable to login to MyQ - GetDoorStatus");
						logger.error(err);
					}
					else {
				    	 data.forEach(function(device){
				    		if (device.deviceName == "Main Garage Door"){
				    			getDoorStatus(account, device.deviceID, function(err, door){
				    				if (err) {
				    		               logger.error("Error " + err);
				    		          } else {
				    		               logger.info("Door is currently " + door);
				    		               if (door == "Open"){ 
				    		                    // Close door
				    		                    closeDoor(account, device.deviceID, function(err, success){
				    		                    	if (err){
				    		                    		logger.error(err);
				    		                    	}else{
				    		                    		callback(null, "closing");
				    		                    	}
				    		                    });
				    		               }
				    		               else if (door == "Closed") { 
				    		                    // Open door
				    		            	   openDoor(account, device.deviceID, function(err, success){
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
	     }
	});
};

var CloseDoorDirect = function(door, callback){
	getMyQDevices(function(err, data){
		if (err){
			console.log(err);
		}
		else {
			console.log("here and working");
	    	 login(function(err, account){
					if (err){
						logger.error("Unable to login to MyQ - GetDoorStatus");
						logger.error(err);
					}
					else {
						if (door == "all"){
							logger.info("closing all doors");
							for (i = 0; i < data.length; i++){
								closeDoor(account, data[i].deviceID, function(err, success){
    		                    	if (err){
    		                    		logger.error(err);
    		                    	}else{
    		                    		callback(null, "closing");
    		                    	}
    		                    });
							}
						}
						else {
							for (i = 0; i < data.length; i++){
								console.log(door);
								console.log(data[i].deviceName);
		    					if (data[i].deviceName == door){
		    						callback(null, "Matched");
		    						closeDoor(account, data[i].deviceID, function(err, success){
	    		                    	if (err){
	    		                    		logger.error(err);
	    		                    	}else{
	    		                    		callback(null, "closing");
	    		                    	}
	    		                    });
		    					}
							}
							logger.warn("No door match found");
    						//callback("No door match found");
						}
						
					}
	    	 });
		}
	});
};

var OpenDoorDirect = function(door, callback){
	getMyQDevices(function(err, data){
		if (err){
			console.log(err);
		}
		else {
			console.log("here and working");
	    	 login(function(err, account){
					if (err){
						logger.error("Unable to login to MyQ - GetDoorStatus");
						logger.error(err);
					}
					else {
						if (door == "all"){
							logger.info("Opening all doors");
							for (i = 0; i < data.length; i++){
								openDoor(account, data[i].deviceID, function(err, success){
    		                    	if (err){
    		                    		logger.error(err);
    		                    	}else{
    		                    		callback(null, "opening");
    		                    	}
    		                    });
							}
						}
						else {
							for (i = 0; i < data.length; i++){
								console.log(door);
								console.log(data[i].deviceName);
		    					if (data[i].deviceName == door){
		    						callback(null, "Matched");
		    						openDoor(account, data[i].deviceID, function(err, success){
	    		                    	if (err){
	    		                    		logger.error(err);
	    		                    	}else{
	    		                    		callback(null, "opening");
	    		                    	}
	    		                    });
		    					}
							}
							logger.warn("No door match found");
    						//callback("No door match found");
						}
						
					}
	    	 });
		}
	});
};
      

var getDoorStatus = function(account, deviceId, callback){
	account.getDoorState(deviceId)
		.then(function(state){
			if (state.returnCode == "0"){
				state["deviceId"] = deviceId;
				callback(null, state);
			}else {
				callback("returnCode " + state.returnCode);
			}
				
		})
		.catch(function (err){
			callback(err);
	})
};


var getState = function(device, callback){
     doorstates = ["Undefined","Open","Closed","Undefined","Opening","Closing"]; // 1=Open,2=Closed,4=Opening,5=Closing
     if (device.MyQDeviceTypeId == garageDoorType){
          device.Attributes.forEach(function(attribute){
               if (attribute.MyQDeviceTypeAttributeId == "56"){
                    state = doorstates[attribute.Value];
                    callback(null, state);
               }
          });
     }
     else {
          callback(null, "No state Found");
     }
};

getMyQDevices = function(callback){
	mongoose.model('MyQ_Devices').find({},{}, { sort: { _id : -1}}, function(err, data){
	     if (err) {
	         logger.error("Unable to get devices from DB"); 
	    	 logger.error(err);
	    	 callback(err);
	     } else {
	    	 callback(null, data);
	     }
	});
};

var getDoorStatuses = function(callback){
	var status = [];
	
	getMyQDevices(function(err, data){
		if (err){
			console.log(err);
		}
		else {
			login(function(err, account){
				if (err){
					logger.error("Unable to login to MyQ - GetDoorStatus");
					logger.error(err);
				}
				else {
					for (i = 0; i < data.length; i++){
			    		 name = data[i].deviceName;
			    		 deviceId = data[i].deviceID;
			    		 getDoorStatus(account, deviceId, function(err, state){
			    			 if (err){
			    				 logger.error(err);
			    			}else {
			    				for (y = 0; y < data.length; y++){
			    					if (data[y].deviceID == state.deviceId){
			    						deviceName = data[y].deviceName;
			    						console.log(deviceName + " is currently " + state.doorStateDescription);
			    						console.log(state);
				           			  	var obj = {};
				           			  	obj[deviceName] = state.doorStateDescription;
				           			  	status.push(obj);
				           			  	// Get all devices and states and return json
				           			  	if (status.length == data.length){
				           			  		console.log(status);
				           			  		callback(null, status);
				           			  	}
			    					}
			    				}
			    			}	    			
		       		  	});
			    	}
				}
			});
		}
	})
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

var postDoorState = function(name, state){
	console.log("Pushing " + name + " is " + state + " to API");
	var qs = require("querystring");
	var http = require("http");

	var options = {
	  "method": "POST",
	  "hostname": "localhost",
	  "port": "3001",
	  "path": "/api/door",
	  "headers": {
	    "cache-control": "no-cache",
	    "host": "HomeAutomation - MyQ",
	    "content-type": "application/x-www-form-urlencoded"
	  }
	};

	var req = http.request(options, function (res) {
	  var chunks = [];

	  res.on("data", function (chunk) {
	    chunks.push(chunk);
	  });

	  res.on("end", function () {
	    var body = Buffer.concat(chunks);
	    // console.log(body.toString());
	  });
	});

	req.write(qs.stringify({ door : name, doorState: state }));
	req.end();
};

get_MyQ_Cred();

setInterval(function(){
	getDoorStatuses(function(err, results){
		if (err){
			logger.error(err);
		}
		else {
			console.log("made it this far");
			results.forEach(function(item){
				name = Object.keys(item)[0];
				state = item[name];
				postDoorState(name, state);
			});
		}
	});
},30000);


module.exports = {
		
	updateMyQDevices: updateDevices,
	
	getDoorStates: getDoorStatuses,
	
	triggerDoor: triggerDoor,
	
	closeDoorDirect: CloseDoorDirect,
	
	openDoorDirect: OpenDoorDirect

};
