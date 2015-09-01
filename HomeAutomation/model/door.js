var mongoose = require('mongoose');  
var doorSchema = new mongoose.Schema({  
  state: String,
  timeStamp: Date
});

mongoose.model('DoorState', doorSchema);