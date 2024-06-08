const express = require('express');
const router = express.Router();
const OTPAuth = require('otpauth');
const User = require('../models/User');
const OtpCode = require('../models/OtpCode');
const Provider = require('../models/Provider');

router.post('/generate', async (req, res) => {
  const { userId, providerId, label } = req.body;
  const provider = await Provider.findById(providerId);
  const user = await User.findById(userId);

  const totp = new OTPAuth.TOTP({
    issuer: provider.name,
    label: label,
    algorithm: provider.algorithm,
    digits: provider.digits,
    period: provider.period,
    secret: OTPAuth.Secret.fromRandom().toString(),
  });

  const otpCode = await new OtpCode({
    user: user._id,
    provider: provider._id,
    secret: totp.secret.toString(),
    counter: provider.default_counter,
  }).save();

  user.otpCodes.push(otpCode._id);
  await user.save();

  res.json({ otpCode });
});

router.post('/validate', async (req, res) => {
  const { userId, providerId, token } = req.body;
  const otpCode = await OtpCode.findOne({ user: userId, provider: providerId });

  const totp = new OTPAuth.TOTP({
    issuer: otpCode.provider.name,
    label: otpCode.label,
    algorithm: otpCode.provider.algorithm,
    digits: otpCode.provider.digits,
    period: otpCode.provider.period,
    secret: OTPAuth.Secret.fromBase32(otpCode.secret),
  });

  const isValid = totp.validate({ token });

  res.json({ isValid });
});

module.exports = router;
