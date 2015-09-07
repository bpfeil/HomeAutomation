var express = require('express');
var router = express.Router();
var mongoose = require('mongoose'); //mongo connection
var bodyParser = require('body-parser'); //parses information from POST
var methodOverride = require('method-override'); //used to manipulate POST
var trigger = require('../lib/doorTrigger'); //used to trigger the door
var logger = require('../lib/logger');
var doorMonitor = require('../lib/doorMonitor');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
      }
}));

//build the REST operations at the base for blobs
//this will be accessible from http://127.0.0.1:3000/blobs if the default route for / is left unchanged
router.route('/')
	.get(function(req, res, next) {
		logger.debug("IN API");
		res.format({
            //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
          html: function(){
              res.render('api/index', {
              	title: 'doorStates',
                  "API" : "API"
                });
          },
          //JSON response will show all blobs in JSON format
          json: function(){
              //res.json(API);
          }
      });
	});

router.route('/door')
    .get(function(req, res, next) {
        //retrieve all blobs from Monogo
        mongoose.model('DoorState').findOne({}, {}, { sort: { 'created_at' : -1 } }, function (err, doorState) {
              if (err) {
                  return logger.error(err);
              } else {
            	  logger.debug(doorState);
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
                    html: function(){
                        res.render('api/door', {
                        	title: 'doorStates',
                            "doorState" : doorState
                          });
                    },
                    //JSON response will show all blobs in JSON format
                    json: function(){
                        res.json(doorState);
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
                  //Blob has been created
                  logger.debug('POST creating new doorState: ' + door);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("door");
                        // And forward to success page
                        res.redirect("/doorState");
                    },
                    //JSON response will show the newly created blob
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


//route middleware to validate :id
router.param('id', function(req, res, next, id) {
    logger.info('validating if ' + id + ' exists');
    //find the ID in the Database
    //mongoose.model('AccessCode').count({_id: id}, function(err, access){
	mongoose.model('AccessCode').findOne({"_id" : id},function (err, access) {
        //if it isn't found, we are going to respond with 404
        if (err) {
        	logger.debug(id + ' was not found');
            logger.error(err);
            res.format({
                html: function(){
                	res.render('api/door', {
                    	title: 'Access Denied',
                        "doorState" : 'Denied'
                    });
                },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        }
        
        //if it is found we continue on 
        /*if(access > 0){
        	logger.info("Passed");
        	logger.info(access);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        }*/
        else {
        	logger.info("Welcome back " + access.name);
        	//logger.info(access);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

/*
router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Blob').findById(req.id, function (err, blob) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + blob._id);
        var blobdob = blob.dob.toISOString();
        blobdob = blobdob.substring(0, blobdob.indexOf('T'))
        res.format({
          html: function(){
              res.render('blobs/show', {
                "blobdob" : blobdob,
                "blob" : blob
              });
          },
          json: function(){
              res.json(blob);
          }
        });
      }
    });
  });
  
/GET the individual blob by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the blob within Mongo
    mongoose.model('Blob').findById(req.id, function (err, blob) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the blob
            console.log('GET Retrieving ID: ' + blob._id);
            //format the date properly for the value to show correctly in our edit form
          var blobdob = blob.dob.toISOString();
          blobdob = blobdob.substring(0, blobdob.indexOf('T'))
            res.format({
                //HTML response will render the 'edit.jade' template
                html: function(){
                       res.render('blobs/edit', {
                          title: 'Blob' + blob._id,
                        "blobdob" : blobdob,
                          "blob" : blob
                      });
                 },
                 //JSON response will return the JSON output
                json: function(){
                       res.json(blob);
                 }
            });
        }
    });
});

//PUT to update a blob by ID
router.put('/:id/edit', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var name = req.body.name;
    var badge = req.body.badge;
    var dob = req.body.dob;
    var company = req.body.company;
    var isloved = req.body.isloved;

   //find the document by ID
        mongoose.model('Blob').findById(req.id, function (err, blob) {
            //update it
            blob.update({
                name : name,
                badge : badge,
                dob : dob,
                isloved : isloved
            }, function (err, blobID) {
              if (err) {
                  res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                      //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                      res.format({
                          html: function(){
                               res.redirect("/blobs/" + blob._id);
                         },
                         //JSON responds showing the updated values
                        json: function(){
                               res.json(blob);
                         }
                      });
               }
            })
        });
});

//DELETE a Blob by ID
router.delete('/:id/edit', function (req, res){
    //find blob by ID
    mongoose.model('Blob').findById(req.id, function (err, blob) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            blob.remove(function (err, blob) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + blob._id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                          html: function(){
                               res.redirect("/blobs");
                         },
                         //JSON returns the item with the message that is has been deleted
                        json: function(){
                               res.json({message : 'deleted',
                                   item : blob
                               });
                         }
                      });
                }
            });
        }
    });
});
 */

module.exports = router;