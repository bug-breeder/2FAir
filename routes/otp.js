const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const isAuthenticated = require('../middlewares/isAuthenticated');

router.post('/add', isAuthenticated, otpController.addOtp);
router.get('/', isAuthenticated, otpController.getOtps);
router.get('/:id/generate', isAuthenticated, otpController.generateCode);

module.exports = router;
