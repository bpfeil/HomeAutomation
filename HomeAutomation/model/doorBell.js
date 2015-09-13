var mongoose = require('mongoose');  
var doorBellSchema = new mongoose.Schema({
  timeStamp: Date
});

mongoose.model('DoorBell', doorBellSchema);