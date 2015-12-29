var mongoose = require('mongoose');  
var homeSchema = new mongoose.Schema({  
  home: String,
  timeStamp: Date
});

mongoose.model('Home', homeSchema);