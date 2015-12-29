//Helper script to run tasks at specific durations
var logger = require('./logger');
var pushBullet = require('./pushBullet');


setDaysTimeout(function() {
	logger.info("Updating PB Devices");
	pushBullet.updateDevices();
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