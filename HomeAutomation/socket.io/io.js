var io = require('socket.io')();
var time = require('../lib/time');
var settings = require('../socket.io/settings.io')(io);
var garage =  require('../socket.io/garage.io')(io);
var worker = require('../lib/worker');

io.on('connection', function(socket){  
	  console.log('a user connected to socket.io');
	  socket.on('disconnect', function(data) {
			socket.send('disconnected...');
		});
	  worker.exposedArduinoState(function(arduinoConnect){
		  socket.emit('date', {'date': time.getDateTime()});
		  socket.emit('Arduino', {'Arduino':arduinoConnect});
	  });
	  setInterval(function(){
		  socket.emit('date', {'date': time.getDateTime()});
		  worker.exposedArduinoState(function(arduinoConnect){
	    		 socket.emit('Arduino', {'Arduino':arduinoConnect});
	         });
	  }, 1000);
});



module.exports = io;