const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  website: { type: String, required: true },
  help_url: { type: String, required: true },
  image_uri: { type: String },
  digits: { type: Number, required: true },
  period: { type: Number, required: true },
  default_counter: { type: Number, default: 1 },
  algorithm: { type: String, required: true },
  method: { type: String, required: true },
});

module.exports = mongoose.model('Provider', ProviderSchema);
