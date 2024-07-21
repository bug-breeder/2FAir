const express = require("express");
const authController = require("../controllers/authController");
const authenticate = require("../middlewares/isAuthenticated");

const router = express.Router();

router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

router.get("/microsoft", authController.microsoftLogin);
router.get("/microsoft/callback", authController.microsoftCallback);

router.post("/refresh-token", authController.refreshAccessToken);

router.post("/logout", authenticate, authController.logout);

module.exports = router;
