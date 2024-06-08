const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

router.get('/', async (req, res) => {
  const providers = await Provider.find();
  res.json(providers);
});

router.post('/', async (req, res) => {
  const provider = new Provider(req.body);
  await provider.save();
  res.json(provider);
});

module.exports = router;
