var config = require('../config');
var arduino = config.arudino || '192.168.1.178';
var arduinoPort = config.arduinoPort || '80';

module.exports = {

	sendTrigger: function(callback){
	
		var http = require("http");

		var options = {
		  "method": "POST",
		  "hostname": "192.168.1.178",
		  "port": null,
		  "path": "/",
		  "headers": {
		    "access": "12badcie2181kdadfs8382280szdakyie332",
		    "trigger": "True"
		  }
		};

		var req = http.request(options, function (res) {
		  var chunks = [];
		  res.on("data", function (chunk) {
			  chunks.push(chunk);
		  });
		  res.on("end", function () {
			  var body = Buffer.concat(chunks);
			  console.log(body.toString());
			  callback(chunks);
		  });
		  console.log("something happens here")
		})
		
		req.on("error", function(error){
			console.log("There was an error reaching the remote host");
            callback(error);
		})

		req.end();
	}
	
};