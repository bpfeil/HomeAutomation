//Helper script to run tasks at specific durations
var logger = require('./logger');
var pushBullet = require('./pushBullet');
var worker = require('../lib/worker');
var myQ = require('../lib/myQ');


setDaysTimeout(function() {
	logger.info("Updating PB Devices");
	pushBullet.updateDevices();
	worker.openingMethod(function(err, methods){
		methods = JSON.parse(methods);
		if (methods.myQ === true){
			logger.info("Updating MyQ Devices");
			myQ.updateMyQDevices();
		}
	});
},1); // fire after 1 days

/*setInterval(function(){//After 20 seconds
}, 20000);
*/

function setDaysTimeout(callback,days) {
    // 86400 seconds in a day
    var msInDay = 86400*1000; 

    var dayCount = 0;
    var timer = setInterval(function() {
        dayCount++;  // a day has passed

        if(dayCount == days) {
           clearInterval(timer);
           callback.apply(this,[]);
        }
    },msInDay);
}