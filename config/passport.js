const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const User = require('../models/user');

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
    callbackURL: '/auth/google/callback'
}, (token, tokenSecret, profile, done) => {
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
        return done(err, user);
    });
}));

// passport.use(new MicrosoftStrategy({
//     clientID: process.env.MICROSOFT_CLIENT_ID,
//     clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
//     callbackURL: '/auth/microsoft/callback',
//     scope: ['user.read']
// }, (token, tokenSecret, profile, done) => {
//     User.findOrCreate({ microsoftId: profile.id }, (err, user) => {
//         return done(err, user);
//     });
// }));

// passport.use(new AppleStrategy({
//     clientID: process.env.APPLE_CLIENT_ID,
//     clientSecret: process.env.APPLE_CLIENT_SECRET,
//     callbackURL: '/auth/apple/callback'
// }, (token, tokenSecret, profile, done) => {
//     User.findOrCreate({ appleId: profile.id }, (err, user) => {
//         return done(err, user);
//     });
// }));
