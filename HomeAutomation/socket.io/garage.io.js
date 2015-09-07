var io = require('socket.io')();
var time = require('../lib/time');
var logger = require('../lib/logger');
var watcher = require('../lib/oplog_Watcher');
var mongoose = require('mongoose'); //mongo connection
var trigger = require('../lib/doorTrigger'); //used to trigger the door

//Start listening for socket event on the logger
/*logger.on("socket", function () {
  this.socketIO = loggerSocket;
});*/

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
	//socket.emit('doorState', {'doorState':doorState});
	//socket.emit('lastActivityEventTime', {lastActivityEventTime:getDateTime1(lastActivityEventTime)});
     
     socket.on('trigger', function(data){
          if (data.trigger == 'Open') {
        	  trigger.sendTrigger(function(status) {
        		  
        	  });
          }
          else if (data.trigger == 'Close') {
               triggerDoor();
          }
          else if (data.trigger == 'Trigger') {
               triggerDoor();
          }
     });
     
     setInterval(function(){//send data every X seconds
    	 watcher.exposedDoorState(function(state){
    			socket.emit('doorState', {'doorState': state});
    		});
    	 /*mongoose.model('DoorState').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, doorState) {
             if (err) {
                 return logger.error(err);
             } else {
           	  //logger.debug("here" + doorState);
           	  socket.emit('doorState', {'doorState':doorState.state});
             }
    	 });*/
          //socket.emit('lastActivityEventTime', {lastActivityEventTime:getDateTime1(lastActivityEventTime)});
     }, 5000);
 
     socket.on('disconnect', function(data) {
          socket.send('disconnected...');
     });
});

module.exports = io;  
