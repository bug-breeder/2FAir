const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback, authController.googleAuthRedirect);

router.get('/microsoft', authController.microsoftAuth);
router.get('/microsoft/callback', authController.microsoftAuthCallback, authController.microsoftAuthRedirect);

router.get('/apple', authController.appleAuth);
router.get('/apple/callback', authController.appleAuthCallback, authController.appleAuthRedirect);

module.exports = router;
