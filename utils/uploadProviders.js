const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Provider = require('../models/provider');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    uploadProviders();
}).catch(err => console.log(err));

const uploadProviders = async () => {
    try {
        const filePath = path.join(__dirname, 'providers.json');
        const providersData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        await Provider.deleteMany({}); // Clear existing data
        await Provider.insertMany(providersData);

        console.log('Providers uploaded successfully');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error uploading providers:', error);
        mongoose.disconnect();
    }
};
