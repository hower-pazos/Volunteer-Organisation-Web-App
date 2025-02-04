require('dotenv').config(); // Load environment variables
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('mysql');

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL
},
  function (accessToken, refreshToken, profile, done) {
    const email = profile.emails[0].value;
    const username = profile.displayName;

    pool.query('SELECT * FROM Users WHERE email_address = ?', [email], (err, results) => {
      if (err) {
        return done(err);
      }

      if (results.length > 0) {
        return done(null, results[0]);
      } else {
        const newUser = {
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          username: username,
          pass_word: '', // No password for Google users
          email_address: email,
          role_permission: 'user',
          email_notifications: false,
          phone_number: null,
          signing_id: null,
          address_id: null,
          branch_id: null
        };

        pool.query('INSERT INTO Users SET ?', newUser, (err, results) => {
          if (err) {
            return done(err);
          }

          newUser.user_id = results.insertId;
          return done(null, newUser);
        });
      }
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser((id, done) => {
  pool.query('SELECT * FROM Users WHERE user_id = ?', [id], (err, results) => {
    if (err) {
      return done(err);
    }
    done(null, results[0]);
  });
});

module.exports = passport;
