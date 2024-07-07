const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const crypto = require("crypto");

const REFRESH_TOKEN = {
  secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
  cookie: {
    name: "refreshTkn",
    options: {
      sameSite: "None",
      secure: true,
      httpOnly: true,
      expires: new Date(
        Date.now() + process.env.AUTH_REFRESH_TOKEN_EXPIRY * 24 * 60 * 60 * 1000
      ), // use day from .env
    },
  },
};

const loginUser = async (req, res, next) => {
  try {
    const user = req.user;

    const accessToken = user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    res.cookie(
      REFRESH_TOKEN.cookie.name,
      refreshToken,
      REFRESH_TOKEN.cookie.options
    );

    // Use req.session.returnTo to redirect to the original URL
    const redirectUrl = req.session.returnTo || "/";
    delete req.session.returnTo;

    res.json({
      success: true,
      user,
      accessToken,
      redirectUrl,
    });
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = (req, res, next) => {
  req.session.returnTo = req.query.returnTo;
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
};

exports.googleCallback = [
  passport.authenticate("google", { failureRedirect: "/" }),
  loginUser,
];

exports.microsoftLogin = (req, res, next) => {
  req.session.returnTo = req.query.returnTo;
  passport.authenticate("microsoft", { scope: ["user.read"] })(req, res, next);
};

exports.microsoftCallback = [
  passport.authenticate("microsoft", { failureRedirect: "/" }),
  loginUser,
];

exports.refreshAccessToken = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    const refreshToken = cookies[REFRESH_TOKEN.cookie.name];

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token is missing" });
    }

    const decodedRefreshToken = jwt.verify(refreshToken, REFRESH_TOKEN.secret);
    const refreshTokenHash = crypto
      .createHmac("sha256", REFRESH_TOKEN.secret)
      .update(refreshToken)
      .digest("hex");

    const user = await User.findOne({
      _id: decodedRefreshToken.id,
      "tokens.token": refreshTokenHash,
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newAccessToken = user.generateAccessToken();

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    const refreshToken = cookies[REFRESH_TOKEN.cookie.name];

    if (refreshToken) {
      const refreshTokenHash = crypto
        .createHmac("sha256", REFRESH_TOKEN.secret)
        .update(refreshToken)
        .digest("hex");

      req.user.tokens = req.user.tokens.filter(
        (tokenObj) => tokenObj.token !== refreshTokenHash
      );
      await req.user.save();
    }

    res.cookie(REFRESH_TOKEN.cookie.name, "", { expires: new Date(0) });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
