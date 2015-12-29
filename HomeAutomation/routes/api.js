var express = require('express');
var router = express.Router();
var mongoose = require('mongoose'); //mongo connection
var bodyParser = require('body-parser'); //parses information from POST
var methodOverride = require('method-override'); //used to manipulate POST
var logger = require('../lib/logger');
var time = require('../lib/time');
var trigger = require('../lib/doorTrigger'); //used to trigger the door
var doorMonitor = require('../lib/doorMonitor');
var pushBullet = require('../lib/pushBullet');
var updateNest = require('../lib/updateNest');


router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
      }
}));

router.route('/')
	.get(function(req, res, next) {
		logger.debug("IN API");
		res.format({
          html: function(){
              res.render('api/index', {
              	title: 'API Root',
                  "API" : "API"
                });
          },
          json: function(){
              res.json(API);
          }
      });
	});

router.route('/door')
    .get(function(req, res, next) {
        //retrieve last entry from Monogo
        mongoose.model('DoorState').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, doorState) {
              if (err) {
                  return logger.error(err);
              } else {
            	  //logger.debug(doorState);
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                    /*html: function(){
                        res.render('api/door', {
                        	title: 'doorStates',
                            "doorState" : doorState
                          });
                    },*/
                    //JSON response
                    json: function(){
                        res.json({"doorStatus": doorState.state});
                    }
                });
              }     
        });
    })
    //POST a doorState
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
    	var state = req.body.doorState;
    	doorMonitor.doorAlert(state);
        mongoose.model('DoorState').create({
            state : state,
            timeStamp : new Date()
        }, function (err, door) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  //DB entry has been created
                  logger.debug('POST creating new doorState: ' + door);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        res.location("door");
                        // And forward to success page
                        res.redirect("/doorState");
                    },
                    //JSON response
                    json: function(){
                        res.json(door);
                    }
                });
              }
        });
    });

router.get('/door/trigger/:id', function(req, res) {
	trigger.sendTrigger(function(status) {
		logger.debug("Response " + status);
		res.render('api/doorTrigger', { 
	    	title: 'Trigger',
	    	"triggerStatus": status});
	});
    
});

router.get('/home', function(req, res){
	var whoHome = [];
	mongoose.model('Home').find({},{}, { sort: { _id : -1}}, function(err,who){
		if (err) {
	          logger.error(err);
	     } else {
	    	 console.log(who);
	    	 who.forEach(function(item){
	    		whoHome.push(item.home); 
	    	 });
	    	 res.format({
	    		 json: function(){
	    			 res.json({"Home": whoHome});
	    		 }
	    	 });
	     }
	});
	
});

router.post('/home/checkin/:id', function(req, res) {
	var who = req.user;
	mongoose.model('Home').findOneAndUpdate({
        home : who},
        {timeStamp : new Date()},
        {upsert: true},
    function (err, home) {
          if (err) {
              res.send("There was a problem adding the information to the database.");
              res.json({"Checkin": "Fail"});
          } else {
        	  res.format({
        		  json: function(){
        			  res.json({"Checkin": "Success", "Hello" : who});
        		  }
        	  });
          }
		});
});

router.post('/home/checkout/:id', function(req, res) {
	var who = req.user;
	mongoose.model('Home').findOneAndRemove({
        home : who 	
       }, function (err, home) {
          if (err) {
              res.send("There was a problem adding the information to the database.");
              res.json({"Checkout": "Fail"});
          } else {
        	  res.format({
        		  json: function(){
        			  res.json({"Checkout": "Success", "Goodbye": who});
        		  }
        	  });
          }
		});
});


//route middleware to validate :id
router.param('id', function(req, res, next, id) {
    logger.info('validating if ' + id + ' exists');
    //find the ID in the Database
	mongoose.model('AccessCode').findOne({"_id" : id},function (err, access) {
        //if it isn't found, we are going to respond with 404
        if (err) {
        	logger.debug(id + ' was not found');
            logger.error(err);
            res.format({
                html: function(){
                	res.render('api/denied', {
                    	title: 'Access Denied',
                        "status" : 'Denied'
                    });
                },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        }
        else {
        	logger.info("Welcome back " + access.name);
        	//logger.info(access);
            // once validation is done save the new item in the req
            req.id = id;
            req.user = access.name;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/doorBell')
.get(function(req, res, next) {
	res.json('Nothing to see here');
})
//POST a doorBell
.post(function(req, res) {
	//Get post from web
	var msg = req.body.doorBell;
	//console.log(msg);
	now = time.getDateTime1(new Date());
	pushBullet.pushNote('Door Bell', 'Ding Dong', 'Someones at the door ' + now);
    mongoose.model('DoorBell').create({
        timeStamp : new Date()
    }, function (err, msg) {
          if (err) {
              res.send("There was a problem adding the information to the database.");
          } else {
              //Entry successful in database
              logger.debug('POST creating new door bell event');
              res.format({
                //JSON response will show the newly created blob
                json: function(){
                    res.json('success');
                }
            });
          }
    });
});

module.exports = router;