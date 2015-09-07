var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//Databse setup
var db = require('./model/db');
var door = require('./model/door');
var access = require('./model/access');
var PB_DB = require('./model/pushBullet_DB');
var garageSettings = require('./model/garageSettings');

var config = require('./config');
var logger = require('./lib/logger');
var oplogWatcher = require('./lib/oplog_Watcher');

var base = require('./routes/index');
//var users = require('./routes/users');
var api = require('./routes/api');
var garage = require('./routes/garage');
var settings = require('./routes/settings');

var app = express();

//call socket.io to the app for each route
//app.io = require('./io');
app.io = require('./socket.io/index.io');
app.io = require('./socket.io/garage.io');

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
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', base);
//app.use('/users', users);
app.use('/api', api);
app.use('/garage', garage);
app.use('/settings', settings);

var server = app.listen(config.port);

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
