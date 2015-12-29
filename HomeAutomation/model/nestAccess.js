var mongoose = require('mongoose');  
var nestAccessSchema = new mongoose.Schema({  
  structureID: String,
  apiToken: String,
  nestUser: String,
  nestPSW: String
});

mongoose.model('NestAccess', nestAccessSchema);