var mongoose = require('mongoose');  
var garageSettingsSchema = new mongoose.Schema({  
  arduino: String,
  arduinoPort: Number,
  notifyTime: Number,
  alerts: Boolean,
  triggerAlerts: Boolean,
  doorStateAlerts: Boolean,
  accessKey: String
});

mongoose.model('GarageSettings', garageSettingsSchema);