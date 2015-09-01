var mongoose = require('mongoose');  
var pushBulletSchema = new mongoose.Schema({  
  PB_Data : Object
});

mongoose.model('PushBullet', pushBulletSchema);