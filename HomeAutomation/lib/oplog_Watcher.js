var MongoOplog = require('mongo-oplog');
var config = require('../config');
var doorMonitor = require('./doorMonitor');
var logger = require('./logger');

var mongoServer = config.mongoServer;
var oplog = MongoOplog('mongodb://' + mongoServer + ':27017/local').tail();

var doorStateWatch = oplog.filter("homeAutomation.doorstates");
var settingsWatch = oplog.filter("homeAutomation.garagesettings");
var doorBell = oplog.filter("homeAutomation.doorbells");

var doorState;

doorStateWatch.on('insert', function(doorStuff){
    //console.log(doorStuff);
    //console.log("state "  + doorStuff.o.state);
    doorState = doorStuff.o.state;
});

settingsWatch.on('update', function(){
	logger.info("settings updated!");
	logger.info("Updating dependencies");
	doorMonitor.getSettings();
});

exports.exposedDoorState = function(callback){
	callback(doorState);
};

/*
 * Unfiltered Stuff
	oplog.on('op', function (data) {
	  //console.log(data);
	  //console.log(data.o.state);
	});
	
	oplog.on('insert', function (doc) {
	  //console.log(doc.op);
	  console.log("state "  + doc.o.state);
	});
	 
	oplog.on('update', function (doc) {
	  console.log(doc.op);
	});
	 
	oplog.on('delete', function (doc) {
	  console.log(doc.op._id);
	});
	 
	oplog.on('error', function (error) {
	  console.log(error);
	});
	
	oplog.on('end', function () {
	  console.log('Stream ended');
	});
	 
	oplog.stop(function () {
	  console.log('server stopped');
	});*/