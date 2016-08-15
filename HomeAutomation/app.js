var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config');

//Databse setup
var db = require('./model/db');
var door = require('./model/door');
var access = require('./model/access');
var PB_DB = require('./model/pushBullet_DB');
var garageSettings = require('./model/garageSettings');
var doorBell = require('./model/doorBell');
var home = require('./model/home');
var nestAccess = require('./model/nestAccess');
var myQ_Access = require('./model/myQ_Access');

//Helper modules
var logger = require('./lib/logger');
var oplogWatcher = require('./lib/oplog_Watcher');
var scheduler = require('./lib/scheduler');

//Route Setup
var base = require('./routes/index');
var api = require('./routes/api');
var garage = require('./routes/garage');
var settings = require('./routes/settings');

var app = express();

//call socket.io to the app
app.io = require('./socket.io/io');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//app.use(logger('dev')); Original
logger.debug("Overriding 'Express' logger");
app.use(morgan('combined', {stream: logger.stream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.use('/', base);
app.use('/api', api);
app.use('/garage', garage);
app.use('/settings', settings);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
  logger.error(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
	logger.error(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  logger.error(err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
