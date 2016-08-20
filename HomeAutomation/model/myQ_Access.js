var mongoose = require('mongoose');  
var myQ_Schema = new mongoose.Schema({  
  user: String,
  password: String
});

mongoose.model('MyQ_Access', myQ_Schema);