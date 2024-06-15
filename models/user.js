const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: String,
    microsoftId: String,
    appleId: String,
    email: String,
    password: String,
    otps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Otp' }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
