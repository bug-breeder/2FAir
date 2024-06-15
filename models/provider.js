const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    website: String,
    help_url: String,
    image_uri: String,
    digits: { type: Number, required: true },
    period: { type: Number, required: true },
    default_counter: { type: Number, required: true },
    algorithm: { type: String, required: true },
    method: { type: String, required: true }
});

const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;
