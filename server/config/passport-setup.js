const passport = require('passport');
const { Strategy } = require('passport-openidconnect');
const { connectToDatabase } = require('../db');
const { ObjectId } = require('mongodb');

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

passport.use(new Strategy({
    issuer: process.env.OIDC_ISSUER,
    authorizationURL: process.env.OIDC_AUTH_URL,
    tokenURL: process.env.OIDC_TOKEN_URL,
    userInfoURL: process.env.OIDC_USERINFO_URL,
    clientID: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    callbackURL: "/api/auth/oidc/callback",
    scope: ['openid', 'profile', 'email'],
    proxy: true
  },
  async (issuer, profile, done) => {
    try {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      
      const existingUser = await usersCollection.findOne({ 
        oidcId: profile.id || profile._json.sub 
      });
      
      if (existingUser) {
        const userData = {
          ...existingUser,
          lastLogin: new Date()
        };
        
        await usersCollection.updateOne(
          { _id: existingUser._id },
          { $set: { lastLogin: new Date() }}
        );
        
        console.log('User logged in with ID:', existingUser._id.toString());
        return done(null, userData);
      }
      
      const newUser = {
        oidcId: profile.id || profile._json.sub,
        email: profile._json.email,
        name: profile._json.name || profile.displayName,
        picture: profile._json.picture,
        xp: 0,
        level: 1,
        tasksCompleted: 0,
        tasks: [],
        completedTasks: [],
        isOptIn: false,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      const result = await usersCollection.insertOne(newUser);
      newUser._id = result.insertedId;
      
      console.log('New user created with ID:', newUser._id.toString());
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }
));

module.exports = passport;