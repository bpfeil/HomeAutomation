/**
 * New node file
 */
var express = require('express');
var router = express.Router();
//var mongoose = require('mongoose'); //mongo connection
var bodyParser = require('body-parser'); //parses information from POST
var methodOverride = require('method-override'); //used to manipulate POST
//var io = require('../io');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
      }
}));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('settings/settingsIndex', {
	  title: "Pfeil's Place Automation Settings"
	});
});

/* GET Garage Door Settings page. */
router.get('/garage', function(req, res, next) {
  res.render('settings/garageSettings', {
	  title: "Pfeil's Place Garage Settings"
	});
});



module.exports = router;
