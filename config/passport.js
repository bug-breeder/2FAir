const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  User.findOne({ googleId: profile.id }, (err, user) => {
    if (!user) {
      const newUser = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        username: profile.displayName
      });
      newUser.save().then(user => done(null, user));
    } else {
      done(err, user);
    }
  });
}));

passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: "/auth/microsoft/callback",
  scope: ['user.read']
}, (accessToken, refreshToken, profile, done) => {
  User.findOne({ microsoftId: profile.id }, (err, user) => {
    if (!user) {
      const newUser = new User({
        microsoftId: profile.id,
        email: profile._json.userPrincipalName,
        username: profile.displayName
      });
      newUser.save().then(user => done(null, user));
    } else {
      done(err, user);
    }
  });
}));

passport.use(new AppleStrategy({
  clientID: process.env.APPLE_CLIENT_ID,
  teamID: "your_team_id",
  keyID: "your_key_id",
  privateKey: fs.readFileSync('path_to_your_key.p8', 'utf8'),
  callbackURL: "/auth/apple/callback"
}, (accessToken, refreshToken, profile, done) => {
  User.findOne({ appleId: profile.id }, (err, user) => {
    if (!user) {
      const newUser = new User({
        appleId: profile.id,
        email: profile.email,
        username: profile.email.split('@')[0]
      });
      newUser.save().then(user => done(null, user));
    } else {
      done(err, user);
    }
  });
}));
