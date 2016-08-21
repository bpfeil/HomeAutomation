var io = require('socket.io')();
var time = require('../lib/time');
var logger = require('../lib/logger');
var worker = require('../lib/worker');
var mongoose = require('mongoose'); //mongo connection
var trigger = require('../lib/doorTrigger'); //used to trigger the door
var myQ = require('../lib/myQ');

var arduino, myQ_Enabled;

module.exports = function(io){
	var garage = io.of('/garage');
	var log = io.of('/garage/log');

	
	garage.on('connection', function(socket){
		logger.info('A user connected to Garage');
		worker.exposedDoorState("Main Garage Door", function(state){
			socket.emit('doorState', {'doorState': state});
		});
		worker.exposedDoorState("3rd Stall", function(state){
			socket.emit('doorState1', {'doorState': state});
		});
		worker.lastDoorActivity(function(time){
			socket.emit('lastActivityEventTime', {lastActivityEventTime:time});
		});
		
		socket.on('trigger', function(data){
			worker.openingMethod(function(err, methods){
				if (err){
					res.render(err);
				}
				else {
					methods = JSON.parse(methods);
					
					if (methods.arduino === true){
						arduino = true;
					}
					if (methods.myQ === true){
						myQ_Enabled = true;
					}
				}
			});
			if (data.trigger == 'Open') {
				if (arduino){
					trigger.sendTrigger(function(status) { });
				}
				if (myQ_Enabled){
					myQ.triggerDoor();
				}
			}			
	        else if (data.trigger == 'Close') {
	        	if (arduino){
					trigger.sendTrigger(function(status) { });
				}
				if (myQ_Enabled){
					myQ.triggerDoor();
				}
	        }
	        else if (data.trigger == 'Trigger') {
	        	if (arduino){
					trigger.sendTrigger(function(status) { });
				}
				if (myQ_Enabled){
					myQ.triggerDoor();
				}
	        }
	     });
	     
	     setInterval(function(){//send data every X seconds
	    	worker.exposedDoorState("Main Garage Door", function(state){
	    		 socket.emit('doorState', {'doorState': state});
	    	});
	    	worker.exposedDoorState("3rd Stall", function(state){
	    		 socket.emit('doorState1', {'doorState': state});
	    	});
	    	 worker.lastDoorActivity(function(time){
	 			socket.emit('lastActivityEventTime', {lastActivityEventTime:time});
	 		});
	     }, 5000);
	 
	     socket.on('disconnect', function(data) {
	          socket.send('disconnected...');
	     });
	});
	
	log.on('connection', function(socket){
		console.log("here");
		logger.streamer(function(logLine){
			socket.emit('log', {'log': logLine});
		});
	});
};
