var mongoose = require('mongoose');  
var doorSchema = new mongoose.Schema({  
  door: String,
  state: String,
  timeStamp: Date
});

mongoose.model('DoorState', doorSchema);