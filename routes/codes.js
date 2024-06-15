const express = require('express');
const jwt = require('jsonwebtoken');
const OTPAuth = require('otpauth');
const AuthCode = require('../models/AuthCode');

const router = express.Router();

router.post('/generate', async (req, res) => {
  const { issuer, label, algorithm, digits, period, secret, method, userId } = req.body;

  try {
    const authCode = new AuthCode({ issuer, label, algorithm, digits, period, secret, method, user: userId });
    await authCode.save();

    res.status(201).json(authCode);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/codes', async (req, res) => {
  const { userId } = req.query;

  try {
    const codes = await AuthCode.find({ user: userId });
    const formattedCodes = codes.map(code => ({
      issuer: code.issuer,
      label: code.label,
      algorithm: code.algorithm,
      digits: code.digits,
      period: code.period,
      secret: code.secret,
      method: code.method
    }));

    res.status(200).json(formattedCodes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;