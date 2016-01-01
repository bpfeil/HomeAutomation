var io = require('socket.io')();
var time = require('../lib/time');
var logger = require('../lib/logger');
var watcher = require('../lib/oplog_Watcher');
var mongoose = require('mongoose'); //mongo connection
var trigger = require('../lib/doorTrigger'); //used to trigger the door


//start listen with socket.io
io.on('connection', function(socket){  
  console.log('a user connected to Garage');
  
  setInterval(function(){
	  socket.emit('date', {'date': time.getDateTime()});
      //socket.emit('Arduino', {'Arduino':arduinoConnect});
  }, 1000);
});


io.of('/garage').on('connection', function(socket){
	 /*mongoose.model('DoorState').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, doorState) {
         if (err) {
             return logger.error(err);
         } else {
       	  socket.emit('doorState', {'doorState':doorState.state});
         }
	 });*/
	watcher.exposedDoorState(function(state){
		socket.emit('doorState', {'doorState': state});
	});
	//socket.emit('lastActivityEventTime', {lastActivityEventTime:getDateTime1(lastActivityEventTime)});
     
     socket.on('trigger', function(data){
          if (data.trigger == 'Open') {
        	  trigger.sendTrigger(function(status) {
        		  
        	  });
          }
          else if (data.trigger == 'Close') {
        	  trigger.sendTrigger(function(status) {
        		  
        	  });
          }
          else if (data.trigger == 'Trigger') {
        	  trigger.sendTrigger(function(status) {
        		  
        	  });
          }
     });
     
     setInterval(function(){//send data every X seconds
    	 watcher.exposedDoorState(function(state){
    			socket.emit('doorState', {'doorState': state});
    		});
          //socket.emit('lastActivityEventTime', {lastActivityEventTime:getDateTime1(lastActivityEventTime)});
     }, 5000);
 
     socket.on('disconnect', function(data) {
          socket.send('disconnected...');
     });
});

io.of('/garage/log').on('connection', function(socket){
	console.log("here");
	logger.streamer(function(logLine){
		socket.emit('log', {'log': logLine});
	});
	//socket.emit('lastActivityEventTime', {lastActivityEventTime:getDateTime1(lastActivityEventTime)});
    
    /*
    setInterval(function(){//send data every X seconds
   	 watcher.exposedDoorState(function(state){
   			socket.emit('doorState', {'doorState': state});
   		});
         //socket.emit('lastActivityEventTime', {lastActivityEventTime:getDateTime1(lastActivityEventTime)});
    }, 5000);

    socket.on('disconnect', function(data) {
         socket.send('disconnected...');
    });
    */
});

module.exports = io;  
