const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  googleId: String,
  microsoftId: String,
  appleId: String,
  email: String,
  authCodes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AuthCode' }]
});

module.exports = mongoose.model('User', userSchema);
