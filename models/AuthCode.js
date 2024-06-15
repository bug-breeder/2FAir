const mongoose = require('mongoose');

const authCodeSchema = new mongoose.Schema({
  issuer: String,
  label: String,
  algorithm: { type: String, default: 'SHA1' },
  digits: { type: Number, default: 6 },
  period: { type: Number, default: 30 },
  secret: String,
  method: { type: String, enum: ['TOTP', 'HOTP', 'Steam'], default: 'TOTP' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('AuthCode', authCodeSchema);
