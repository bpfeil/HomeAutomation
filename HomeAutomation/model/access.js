var mongoose = require('mongoose');  
var accessSchema = new mongoose.Schema({  
  name: String,
  access: String
});

mongoose.model('AccessCode', accessSchema);