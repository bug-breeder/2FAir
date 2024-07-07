const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  googleId: String,
  microsoftId: String,
  email: String,
  tokens: [{ token: String }],
});

userSchema.methods.generateAccessToken = function () {
  const user = this;
  const accessToken = jwt.sign(
    { id: user._id.toString() },
    process.env.AUTH_ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1m", // 15 minutes
    }
  );
  return accessToken;
};

userSchema.methods.generateRefreshToken = async function () {
  const user = this;
  const refreshToken = jwt.sign(
    { id: user._id.toString() },
    process.env.AUTH_REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRY + "d", // e.g. "7d" for 7 days
    }
  );

  const refreshTokenHash = crypto
    .createHmac("sha256", process.env.AUTH_REFRESH_TOKEN_SECRET)
    .update(refreshToken)
    .digest("hex");

  user.tokens = user.tokens.concat({ token: refreshTokenHash });
  await user.save();

  return refreshToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
