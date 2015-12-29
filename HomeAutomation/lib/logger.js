var winston = require('winston');
var fs = require('fs');
winston.emitErrs = true;
var logDirectory = './log';

if (fs.existsSync(logDirectory)){
	console.log("Log Directory Exists");
	}
else {
	fs.mkdirSync(logDirectory);
}

//filename: logDirectory + '/access-%DATE%.log',

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: logDirectory + '/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false,
            prettyPrint: true
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});
/*
var streamer = winston.stream({ start: -10}).on(logDirectory + '/all-logs.log', function(log) {
	//console.log(log);
});
*/
module.exports = logger;
//module.exports = streamer;
module.exports.stream = {
		write: function(message, encoding){
        logger.info(message);
    }
};