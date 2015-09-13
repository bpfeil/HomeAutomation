//Gets settings for Arduino communication and triggers door when called

var mongoose = require('mongoose'); //mongo connection
var logger = require('./logger');
var pushBullet = require('./pushBullet');
var time = require('./time');

var arduino, arduinoPort, accessKey, triggerAlerts;

mongoose.model('GarageSettings').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, settings) {
    if (err) {
    	logger.error("Unable to get settings from DB");
        return logger.error(err);
    } else {
    	arduino = settings.arduino;
    	arduinoPort = settings.arduinoPort;
    	accessKey = settings.accessKey;
    	triggerAlerts = settings.triggerAlerts;
    }
});

module.exports = {

	sendTrigger: function(callback){
	
		var http = require("http");

		var options = {
		  "method": "POST",
		  "hostname": arduino,
		  "port": arduinoPort,
		  "path": "/",
		  "headers": {
		    "access": accessKey,
		    "trigger": "True"
		  }
		};

		var req = http.request(options, function (res) {
			console.log(options);
		  var chunks = [];
		  res.on("data", function (chunk) {
			  chunks.push(chunk);
		  });
		  res.on("end", function () {
			  var body = Buffer.concat(chunks);
			  callback(chunks);
		  });
		  logger.debug("something happens here");
          desc = "Door Triggered @ \n" + time.getDateTime1(new Date());
		  pushBullet.pushNote("Garage Door", "Door Triggered", desc);
		});
		
		req.on("error", function(error){
			logger.error("There was an error reaching the remote host - " + arduino + ":" + arduinoPort);
			pushBullet.pushNote("Door Not Triggered", "Door not triggered because Arduino is offline");
            callback(error);
		});
		
		req.setTimeout(2000,function () {
			  req.abort();
			  logger.info("timeout");
			});

		req.end();
	}
	
};