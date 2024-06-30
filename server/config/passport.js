const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
}, async (token, tokenSecret, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // If the user exists, update their Google ID
            user.googleId = profile.id;
        } else {
            // Otherwise, create a new user
            user = new User({
                googleId: profile.id,
                email: profile.emails[0].value,
            });
        }

        await user.save();
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: '/auth/microsoft/callback',
    scope: ['user.read']
}, async (token, tokenSecret, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // If the user exists, update their Microsoft ID
            user.microsoftId = profile.id;
        } else {
            // Otherwise, create a new user
            user = new User({
                microsoftId: profile.id,
                email: profile.emails[0].value,
            });
        }

        await user.save();
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// passport.use(new AppleStrategy({
//     clientID: process.env.APPLE_CLIENT_ID,
//     clientSecret: process.env.APPLE_CLIENT_SECRET,
//     callbackURL: '/auth/apple/callback',
//     scope: []
// }, async (token, tokenSecret, profile, done) => {
//     try {
//         let user = await User.findOne({ email: profile.emails[0].value });

//         if (user) {
//             // If the user exists, update their Apple ID
//             user.appleId = profile.id;
//         } else {
//             // Otherwise, create a new user
//             user = new User({
//                 appleId: profile.id,
//                 email: profile.emails[0].value,
//             });
//         }

//         await user.save();
//         done(null, user);
//     } catch (err) {
//         done(err, null);
//     }
// }));
