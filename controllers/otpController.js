const OTPAuth = require('otpauth');
const Otp = require('../models/otp');
const providers = require('../data/providers'); // Assume providers data is loaded from a separate file

exports.addOtp = async (req, res) => {
    const { otpauthUri } = req.body;
    const parsedUri = OTPAuth.URI.parse(otpauthUri);
    const provider = providers.find(p => p.name === parsedUri.issuer);

    if (!provider) {
        return res.status(400).json({ error: 'Provider not found' });
    }

    const newOtp = new Otp({
        user: req.user.id,
        issuer: provider.name,
        label: parsedUri.label,
        secret: parsedUri.secret.base32,
        algorithm: provider.algorithm,
        digits: provider.digits,
        period: provider.period,
        counter: provider.default_counter,
        method: provider.method
    });

    await newOtp.save();

    res.json(newOtp);
};

exports.getOtps = async (req, res) => {
    const otps = await Otp.find({ user: req.user.id }).select('issuer label');
    res.json(otps);
};

exports.generateCode = async (req, res) => {
    const { id } = req.params;
    const otp = await Otp.findById(id);

    if (!otp) {
        return res.status(404).json({ error: 'OTP not found' });
    }

    let token;
    if (otp.method === 'TOTP') {
        const totp = new OTPAuth.TOTP({
            issuer: otp.issuer,
            label: otp.label,
            algorithm: otp.algorithm,
            digits: otp.digits,
            period: otp.period,
            secret: otp.secret
        });
        token = totp.generate();
    } else if (otp.method === 'HOTP') {
        const hotp = new OTPAuth.HOTP({
            issuer: otp.issuer,
            label: otp.label,
            algorithm: otp.algorithm,
            digits: otp.digits,
            counter: otp.counter,
            secret: otp.secret
        });
        token = hotp.generate();
        otp.counter += 1;
        await otp.save();
    }

    res.json({ token });
};
