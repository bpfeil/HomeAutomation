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
var worker = require('../lib/worker');
var updateNest = require('../lib/updateNest');
var myQ = require('../lib/myQ');


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
    	door = req.headers.door;
    	mongoose.model('DoorState').findOne({door: "Main Garage Door"}, {}, { sort: { _id : -1 } }, function (err, doorState) {
        //mongoose.model('DoorState').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, doorState) {
              if (err) {
                  return logger.error(err);
              } else {
            	  //logger.debug(doorState);
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                    //JSON response
                    json: function(){
                        res.json({"door" : doorState.door, "doorStatus": doorState.state});
                    }
                });
              }     
        });
    })
    //POST a doorState
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
    	worker.arduinoWatcher(req.headers.host);
    	var state = req.body.doorState;
    	var door = req.body.door;
    	logger.debug('POST creating new doorState: ' + state + " for " + door);
    	doorMonitor.doorAlert(door, state);
    	worker.exposedDoorState(door, function(dbState){
    		if (dbState != state){
    			console.log(dbState);
    			console.log("Updating DB");
    			mongoose.model('DoorState').create({
    				door : door,
    	            state : state,
    	            timeStamp : time.getDateTime1(new Date())
    	        }, function (err, door) {
    	              if (err) {
    	                  res.send("There was a problem adding the information to the database.");
    	              } else {
    	                  //DB entry has been created
    	                  res.format({
    	                    //JSON response
    	                    json: function(){
    	                        res.json(door);
    	                    }
    	                });
    	              }
    	        });
    		}
    		else {
    			logger.debug("No need to update door state for " + door);
    			res.format({
                    //JSON response
                    json: function(){
                        res.json(state);
                    }
    			});
    		}
    	});
    });

router.route('/doors')
.get(function(req, res, next) {
    //retrieve last entry from Monogo
	mongoose.model('DoorState').findOne({}, {}, { sort: { _id : -1 } }, function (err, doorState) {
    //mongoose.model('DoorState').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, doorState) {
          if (err) {
              return logger.error(err);
          } else {
        	  //logger.debug(doorState);
              //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
        	  var obj = {};
			  obj[doorState.door] = doorState.state;
        	  res.format({
                //JSON response
                json: function(){
                    res.json(obj);
                }
            });
          }     
    });
});

router.get('/door/trigger/:id', function(req, res) {
	worker.openingMethod(function(err, methods){
		if (err){
			res.render(err);
		}
		else {
			methods = JSON.parse(methods);
			
			if (methods.arduino === true){
				trigger.sendTrigger(function(status) {
					logger.debug("Response " + status);
					res.render('api/doorTrigger', { 
				    	title: 'Trigger',
				    	"triggerStatus": status});
				});
			}
			if (methods.myQ === true){
				myQ.triggerDoor(function(err,success){
					if (err){
						logger.error(err);
					}else {
						res.render('api/doorTrigger', { 
					    	title: 'Trigger',
					    	"triggerStatus": success});
					}
				});
			}
			else {
				res.json({"Status": "Nothing enabled to open doors"});
				pushBullet.pushNote("Door Not Triggered", "No devices enabled for garage doors.");
			}
		}
	});
});

router.post('/door/close/:id', function(req, res) {
	var door = req.body.door;
	worker.openingMethod(function(err, methods){
		if (err){
			res.render(err);
		}
		else {
			methods = JSON.parse(methods);
			
			
			if (methods.arduino === true){
				trigger.sendTrigger(function(status) {
					logger.debug("Response " + status);
					res.render('api/doorTrigger', { 
				    	title: 'Trigger',
				    	"triggerStatus": status});
				});
			}
			if (methods.myQ === true){
				myQ.closeDoorDirect(door, function(err,success){
					if (err){
						logger.error(err);
					}else {
						res.format({
			        		  json: function(){
			        			  res.json({"DoorStatus" : success});
			        		  }
						});
					}
				});
			}
			else {
				res.json({"Status": "Nothing enabled to open doors"});
				pushBullet.pushNote("Door Not Triggered", "No devices enabled for garage doors.");
			}
		}
	});
});

router.post('/door/open/:id', function(req, res) {
	var door = req.body.door;
	worker.openingMethod(function(err, methods){
		if (err){
			res.render(err);
		}
		else {
			methods = JSON.parse(methods);
			
			
			if (methods.arduino === true){
				trigger.sendTrigger(function(status) {
					logger.debug("Response " + status);
					res.render('api/doorTrigger', { 
				    	title: 'Trigger',
				    	"triggerStatus": status});
				});
			}
			if (methods.myQ === true){
				myQ.openDoorDirect(door, function(err,success){
					if (err){
						logger.error(err);
					}else {
						res.format({
			        		  json: function(){
			        			  res.json({"DoorStatus" : success});
			        		  }
						});
					}
				});
			}
			else {
				res.json({"Status": "Nothing enabled to open doors"});
				pushBullet.pushNote("Door Not Triggered", "No devices enabled for garage doors.");
			}
		}
	});
});

router.get('/home', function(req, res){
	var whoHome = [];
	mongoose.model('Home').find({},{}, { sort: { _id : -1}}, function(err,who){
		//db.collection.find().limit(1).sort({$natural:-1})

		if (err) {
	          logger.error(err);
	     } else {
	    	 console.log(who.length);
	    	 if (who.length > 0){
	    		 who.forEach(function(item){
	    			 whoHome.push(item.home);
	    		 });
	    	 }
	    	 else {
	    		 whoHome = "No One";
	    	 }
	    	 res.format({
	    		 json: function(){
	    			 res.json({"Home": whoHome.toString()});
	    		 }
	    	 });
	     }
	});
	
});

router.get('/home/checkin/:id', function(req, res) {
	var who = req.user;
	mongoose.model('Home').findOneAndUpdate({
        home : who},
        {timeStamp : time.getDateTime1(new Date())},
        {upsert: true},
    function (err, home) {
          if (err) {
              res.send("There was a problem adding the information to the database.");
              res.json({"Checkin": "Fail"});
          } else {
        	  worker.home("checkin");
        	  res.format({
        		  json: function(){
        			  res.json({"Checkin": "Success", "Hello" : who});
        		  }
        	  });
          }
		});
});

router.get('/home/checkout/:id', function(req, res) {
	var who = req.user;
	mongoose.model('Home').findOneAndRemove({
        home : who 	
       }, function (err, home) {
          if (err) {
              res.send("There was a problem removing the information from the database.");
              res.json({"Checkout": "Fail"});
          } else {
        	  worker.home("checkout");
        	  res.format({
        		  json: function(){
        			  res.json({"Checkout": "Success", "Goodbye": who});
        		  }
        	  });
          }
		});
});

router.get('/home/nestStatus', function(req, res){
	updateNest.getNestAwayStatus(function(response){
		res.format({
			json: function(){
				res.json({"NestStatus" : response});
			}
		});
	});
});

router.get('/home/thermostat_data', function(req, res){
	worker.thermoMethod(function(err, results){
		if (err){
			logger.error(err);
		}
		else {
			results = JSON.parse(results);
			if (results.nest){
				updateNest.getHouseData(function(response){
					//console.log(response);
					res.format({
						json: function(){
							res.send(response);
						}
					});
				});
			}
			if (results.ecobee){
				console.log("get ecobeee data TBD");
				res.format({
					json: function(){
						res.send("TBD");
					}
				});
			}
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