const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  let user = await User.findOne({ email });
  if (!user) {
    user = await new User({ email, password: 'default' }).save();
  }
  done(null, user);
}));

passport.use(new AppleStrategy({
  clientID: process.env.APPLE_CLIENT_ID,
  teamID: process.env.APPLE_TEAM_ID,
  keyID: process.env.APPLE_KEY_ID,
  privateKey: process.env.APPLE_PRIVATE_KEY,
  callbackURL: '/auth/apple/callback'
}, async (accessToken, refreshToken, idToken, profile, done) => {
  const email = profile.email;
  let user = await User.findOne({ email });
  if (!user) {
    user = await new User({ email, password: 'default' }).save();
  }
  done(null, user);
}));

passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: '/auth/microsoft/callback',
  scope: ['user.read']
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  let user = await User.findOne({ email });
  if (!user) {
    user = await new User({ email, password: 'default' }).save();
  }
  done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
