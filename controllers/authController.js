const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleAuthCallback = passport.authenticate('google', { failureRedirect: '/' });

exports.googleAuthRedirect = (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`/?token=${token}`);
};

// exports.microsoftAuth = passport.authenticate('microsoft');

// exports.microsoftAuthCallback = passport.authenticate('microsoft', { failureRedirect: '/' });

// exports.microsoftAuthRedirect = (req, res) => {
//     const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.redirect(`/?token=${token}`);
// };

// exports.appleAuth = passport.authenticate('apple');

// exports.appleAuthCallback = passport.authenticate('apple', { failureRedirect: '/' });

// exports.appleAuthRedirect = (req, res) => {
//     const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.redirect(`/?token=${token}`);
// };
