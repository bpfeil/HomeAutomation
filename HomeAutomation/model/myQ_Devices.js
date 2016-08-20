var mongoose = require('mongoose');  
var myQ_Devices_Schema = new mongoose.Schema({  
  user: String,
  deviceID: String,
  deviceName: String
});

mongoose.model('MyQ_Devices', myQ_Devices_Schema);