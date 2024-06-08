const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/');
});

router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback', passport.authenticate('apple', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/');
});

router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
router.get('/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/');
});

module.exports = router;
