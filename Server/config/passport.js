const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback",
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 Google OAuth Profile:', {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
      verified: profile.emails?.[0]?.verified,
      picture: profile.photos?.[0]?.value
    });

    // Check if user already exists
    let user = await User.findByOAuthId('google', profile.id);
    
    if (user) {
      console.log('✅ Existing Google user found, updating...');
      // Update last login and OAuth data
      user.lastLogin = new Date();
      user.oauthProvider = 'google';
      user.oauthData = {
        ...user.oauthData,
        google: {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0]?.value,
          verified_email: profile.emails[0].verified
        } || {}
      };
      // Also update main profile fields if they're different
      if (profile.displayName && user.name !== profile.displayName) {
        user.name = profile.displayName;
      }
      if (profile.photos[0]?.value && user.avatar !== profile.photos[0].value) {
        user.avatar = profile.photos[0].value;
      }
      
      await user.save();
      console.log('✅ Google user updated successfully');
      return done(null, user);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: profile.emails[0].value });
    if (existingUser) {
      console.log('✅ Existing user with same email found, linking Google account...');
      // Link OAuth account to existing user
      existingUser.googleId = profile.id;
      existingUser.oauthProvider = 'google';
      existingUser.oauthData = {
        ...existingUser.oauthData,
        google: {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0]?.value,
          verified_email: profile.emails[0].verified
        } || {}
      };
      existingUser.lastLogin = new Date();
      await existingUser.save();
      console.log('✅ Google account linked successfully');
      return done(null, existingUser);
    }

    // Create new user
    console.log('✅ Creating new Google user...');
    user = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0]?.value || 'https://via.placeholder.com/150',
      googleId: profile.id,
      oauthProvider: 'google',
      oauthData: {
        google: {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0]?.value,
          verified_email: profile.emails[0].verified
        } || {}
      },
      isVerified: true, // OAuth users are verified
      lastLogin: new Date()
    });

    await user.save();
    console.log('✅ New Google user created successfully:', user._id);
    return done(null, user);
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return done(error, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/api/auth/github/callback",
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 GitHub OAuth Profile:', {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
      bio: profile._json.bio,
      location: profile._json.location,
      avatar_url: profile.photos?.[0]?.value
    });

    // Check if user already exists
    let user = await User.findByOAuthId('github', profile.id);
    
    if (user) {
      console.log('✅ Existing GitHub user found, updating...');
      // Update last login and OAuth data
      user.lastLogin = new Date();
      user.oauthProvider = 'github';
      user.oauthData = {
        ...user.oauthData,
        github: {
          id: profile.id,
          login: profile.username,
          email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
          name: profile.displayName || profile.username,
          avatar_url: profile.photos[0]?.value,
          bio: profile._json.bio,
          location: profile._json.location,
          company: profile._json.company,
          blog: profile._json.blog,
          twitter_username: profile._json.twitter_username
        } || {}
      };
      // Also update main profile fields if they're different
      if (profile.displayName && user.name !== profile.displayName) {
        user.name = profile.displayName;
      }
      if (profile.photos[0]?.value && user.avatar !== profile.photos[0].value) {
        user.avatar = profile.photos[0].value;
      }
      if (profile._json.bio && user.bio !== profile._json.bio) {
        user.bio = profile._json.bio;
      }
      if (profile._json.location && user.location !== profile._json.location) {
        user.location = profile._json.location;
      }
      
      await user.save();
      console.log('✅ GitHub user updated successfully');
      return done(null, user);
    }

    // Get email from GitHub profile
    const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('✅ Existing user with same email found, linking GitHub account...');
      // Link OAuth account to existing user
      existingUser.githubId = profile.id;
      existingUser.oauthProvider = 'github';
      existingUser.oauthData = {
        ...existingUser.oauthData,
        github: {
          id: profile.id,
          login: profile.username,
          email: email,
          name: profile.displayName || profile.username,
          avatar_url: profile.photos[0]?.value,
          bio: profile._json.bio,
          location: profile._json.location,
          company: profile._json.company,
          blog: profile._json.blog,
          twitter_username: profile._json.twitter_username
        } || {}
      };
      existingUser.lastLogin = new Date();
      await existingUser.save();
      console.log('✅ GitHub account linked successfully');
      return done(null, existingUser);
    }

    // Create new user
    console.log('✅ Creating new GitHub user...');
    user = new User({
      name: profile.displayName || profile.username,
      email: email,
      avatar: profile.photos[0]?.value || 'https://via.placeholder.com/150',
      bio: profile._json.bio,
      location: profile._json.location,
      githubId: profile.id,
      oauthProvider: 'github',
      oauthData: {
        github: {
          id: profile.id,
          login: profile.username,
          email: email,
          name: profile.displayName || profile.username,
          avatar_url: profile.photos[0]?.value,
          bio: profile._json.bio,
          location: profile._json.location,
          company: profile._json.company,
          blog: profile._json.blog,
          twitter_username: profile._json.twitter_username
        } || {}
      },
      isVerified: true, // OAuth users are verified
      lastLogin: new Date()
    });

    await user.save();
    console.log('✅ New GitHub user created successfully:', user._id);
    return done(null, user);
  } catch (error) {
    console.error('❌ GitHub OAuth error:', error);
    return done(error, null);
  }
}));

module.exports = passport; 