const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuer: String,
    label: String,
    secret: String,
    algorithm: String,
    digits: Number,
    period: Number,
    counter: Number,
    method: String,
    createdAt: { type: Date, default: Date.now }
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
