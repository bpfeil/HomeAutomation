var mongoose = require('mongoose');  
var settingsSchema = new mongoose.Schema({  
  nest: Boolean,
  ecobee: Boolean
});

mongoose.model('Settings', settingsSchema);