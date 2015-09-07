var mongoose = require('mongoose');  
var pushBulletSchema = new mongoose.Schema({  
	user: String,
	API_KEY: String,
	PB_Data : Object
});

mongoose.model('PushBullet', pushBulletSchema);