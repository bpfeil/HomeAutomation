var io = require('socket.io')();
var time = require('../lib/time');
var logger = require('../lib/logger');
var watcher = require('../lib/oplog_Watcher');
var worker = require('../lib/worker');
var mongoose = require('mongoose'); //mongo connection

var nest, ecobee;

module.exports = function(io){
	var settings = io.of('/settings');
	
	settings.on('connection', function(socket){
		logger.info('A user connected to /settings');
		socket.on('disconnect', function(data) {
			socket.send('disconnected...');
		});
	});
	
	settings.on('connection', function(socket){
		logger.info('A user connected to /settings');
		mongoose.model('Settings').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, settings) {
		    if (err) {
		    	logger.error("Unable to get settings from DB");
		    } else {
		    	console.log(settings);
		    	socket.emit('Nest', {'Nest': settings.nest});
		    	socket.emit('Ecobee', {'Ecobee' : settings.ecobee});
		    }
		});
		
		socket.on('nest', function(data) {
	        if (data.nest == 'On') {
	             nest = true;
	        }
	        else if (data.nest == 'Off') {
	             nest = false;
	        }
	        worker.updateSettings('nest', nest, function(data){
	        	logger.info(data); 
	         });
		});
	    socket.on('ecobee', function(data) {
	    	if (data.ecobee == 'On') {
	    		ecobee = true;
	    	}
	    	else if (data.ecobee == 'Off') {
	    		ecobee = false;
	    	}
	    	worker.updateSettings('ecobee', ecobee, function(data){
	    		logger.info(data);
	    	});
	   });
	  
	});
};
