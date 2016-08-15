var mongoose = require('mongoose');  
var garageSettingsSchema = new mongoose.Schema({  
  arduino: String,
  arduinoPort: Number,
  notifyTime: Number,
  alerts: Boolean,
  triggerAlerts: Boolean,
  doorStateAlerts: Boolean,
  accessKey: String,
  arduinoEnabled: Boolean,
  myQ: Boolean
});

mongoose.model('GarageSettings', garageSettingsSchema);