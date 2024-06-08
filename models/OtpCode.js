const mongoose = require('mongoose');

const OtpCodeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  secret: { type: String, required: true },
  counter: { type: Number, default: 1 },
});

module.exports = mongoose.model('OtpCode', OtpCodeSchema);
