var io = require('socket.io')();
var time = require('./lib/time');
var logger = ('../bin/logger');

//Start listening for socket event on the logger
/*logger.on("socket", function () {
  this.socketIO = loggerSocket;
});*/

//start listen with socket.io
io.on('connection', function(socket){  
  console.log('a user connected');
  
  setInterval(function(){
	  socket.emit('date', {'date': time.getDateTime()});
      //socket.emit('Arduino', {'Arduino':arduinoConnect});
  }, 1000);
});

module.exports = io;  