var io = require('socket.io')();
var time = require('../lib/time');
var logger = require('../lib/logger');
var worker = require('../lib/worker');
var mongoose = require('mongoose'); //mongo connection
var trigger = require('../lib/doorTrigger'); //used to trigger the door

module.exports = function(io){
	var garage = io.of('/garage');
	var log = io.of('/garage/log');

	
	garage.on('connection', function(socket){
		logger.info('A user connected to Garage');
		worker.exposedDoorState(function(state){
			socket.emit('doorState', {'doorState': state});
		});
		worker.lastDoorActivity(function(time){
			socket.emit('lastActivityEventTime', {lastActivityEventTime:time});
		});
		
		socket.on('trigger', function(data){
			if (data.trigger == 'Open') {
				trigger.sendTrigger(function(status) { });
			}
	        else if (data.trigger == 'Close') {
	        	trigger.sendTrigger(function(status) { });
	        }
	        else if (data.trigger == 'Trigger') {
	        	trigger.sendTrigger(function(status) { });
	        }
	     });
	     
	     setInterval(function(){//send data every X seconds
	    	worker.exposedDoorState(function(state){
	    		 socket.emit('doorState', {'doorState': state});
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
