const passport = require('passport');
const TwitchStrategy = require('passport-twitch').Strategy;
const { User } = require('../models');

passport.use(new TwitchStrategy({
    clientID: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackURL: process.env.TWITCH_REDIRECT_URI,
    scope: ['user:read:email', 'channel:read:subscriptions', 'analytics:read:games']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ where: { twitch_id: profile.id } });
      
      if (user) {
        // Update existing user
        user.access_token = accessToken;
        user.refresh_token = refreshToken;
        user.last_login = new Date();
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          twitch_id: profile.id,
          username: profile.login,
          display_name: profile.display_name,
          email: profile.email,
          profile_image_url: profile.profile_image_url,
          access_token: accessToken,
          refresh_token: refreshToken,
          last_login: new Date()
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
