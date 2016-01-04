var io = require('socket.io')();
var time = require('../lib/time');
var logger = require('../lib/logger');
var watcher = require('../lib/oplog_Watcher');
var worker = require('../lib/worker');
var mongoose = require('mongoose'); //mongo connection

module.exports = function(io){
	var settings = io.of('/settings');
	var garageSettings = io.of('/settings/garage');
	
	settings.on('connection', function(socket){
		logger.info('A user connected to /settings');
		socket.on('disconnect', function(data) {
			socket.send('disconnected...');
		});
	});
	
	garageSettings.on('connection', function(socket){
		logger.info('A user connected to /settings/garage');
		mongoose.model('GarageSettings').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, settings) {
		    if (err) {
		    	logger.error("Unable to get settings from DB");
		    } else {
		    	socket.emit('Alerts', {'Alerts': settings.alerts});
		    	socket.emit('notify_time', {'notify_time': settings.notifyTime});
		    	socket.emit('triggerAlerts', {'triggerAlerts': settings.triggerAlerts});
		    	socket.emit('doorStateAlerts', {'doorStateAlerts': settings.doorStateAlerts});
		    	socket.emit('arduinoIP', {'arduinoIP': settings.arduino});
		    	socket.emit('arduinoPort', {'arduinoPort': settings.arduinoPort});
		    	socket.emit('arduinoAccessKey', {'arduinoAccessKey': settings.accessKey});
		    }
		});
		
		socket.on('alerts', function(data) {
	        if (data.alerts == 'On') {
	             alerts = true;
	        }
	        else if (data.alerts == 'Off') {
	             alerts = false;
	        }
	        worker.updateGarageSettings('alerts', alerts, function(data){
	        	logger.info(data); 
	         });
	   });
	   socket.on('notify_time', function(data){
		   console.log(data.notify_time);
	        if (data.notify_time === ""){
	             notifyTime = 0;
	        }
	        else{
	             notifyTime = data.notify_time;
	        }
	        worker.updateGarageSettings('notifyTime', notifyTime, function(data){
	        	logger.info(data); 
	         });
	   });
	   socket.on('triggerAlerts', function(data) {
	        if (data.triggerAlerts == 'On') {
	             triggerAlerts = true;
	        }
	        else if (data.triggerAlerts == 'Off') {
	             triggerAlerts = false;
	        }
	        worker.updateGarageSettings('triggerAlerts', triggerAlerts, function(data){
	        	logger.info(data); 
	         });
	   });
	   socket.on('doorStateAlerts', function(data) {
	        if (data.doorStateAlerts == 'On') {
	             doorStateAlerts = true;
	        }
	        else if (data.doorStateAlerts == 'Off') {
	             doorStateAlerts = false;
	        }
	        worker.updateGarageSettings('doorStateAlerts', doorStateAlerts, function(data){
	        	logger.info(data); 
	         });
	   });
	   socket.on('arduinoIP', function(data) {
		   worker.updateGarageSettings('arduino', data.arduinoIP, function(data){
			   logger.info(data);
		   });
	   });
	   socket.on('arduinoPort', function(data) {
		   worker.updateGarageSettings('arduinoPort', data.arduinoPort, function(data){
			   logger.info(data);
		   });
	   });
	});
};
