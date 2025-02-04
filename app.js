/* eslint-disable no-console */

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session'); // session for log in and logging out

const passport = require('./passport'); //oauth
require('dotenv').config();


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var rsvpRouter = require('./routes/rsvp'); // Import the RSVP router
var mysql = require('mysql');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var database = mysql.createPool({
  host: 'localhost',
  user: 'admin',
  password: 'admin123',
  database: 'project_database'
});

app.set('trust proxy', 1); // trust first proxy
app.use(session({
  key: 'cookie1',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: app.get('env') === 'production' }
}));

app.use(function (req, res, next) {
  req.pool = database;
  next();
});

global.loginFlag = false;
global.adminFlag = false;
global.managerFlag = false;
global.userName = '';


// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes for Google OAuth
app.get('/auth/google', (req, res, next) => {
  console.log("Attempting to authenticate with Google");
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Set session flags
    req.session.userId = req.user.user_id;
    global.loginFlag = true;
    global.userName = req.user.username;

    // Check if user has provided phone number and address
    const userId = req.user.user_id;
    database.query('SELECT phone_number, address_id FROM Users WHERE user_id = ?', [userId], (err, results) => {
      if (err) {
        console.error('Error fetching user details:', err);
        return res.status(500).send('Server error');
      }

      const user = results[0];
      if (!user.phone_number || !user.address_id) {
        // Redirect to additional details form if phone number or address is missing
        return res.redirect('/additional-details');
      }

      // Redirect to home page if additional details are not needed
      res.redirect('/');
    });
  }
);


  app.get('/additional-details', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'additional-details.html'));
  });

  app.post('/additional-details', (req, res) => {
    const userId = req.session.passport.user;
    const { phone_number, street_num, street_name, city, state_region, postcode, country } = req.body;

    // Insert address into Addresses table
    const addressQuery = 'INSERT INTO Addresses (street_num, street_name, city, state_region, postcode, country) VALUES (?, ?, ?, ?, ?, ?)';
    const userUpdateQuery = 'UPDATE Users SET phone_number = ?, address_id = ? WHERE user_id = ?';

    req.pool.getConnection((error, connection) => {
      if (error) {
        return res.status(500).send('Error getting database connection');
      }

      connection.query(addressQuery, [street_num, street_name, city, state_region, postcode, country], (err, results) => {
        if (err) {
          connection.release();
          return res.status(500).send('Error inserting address');
        }

        const addressId = results.insertId;
        connection.query(userUpdateQuery, [phone_number, addressId, userId], (err, results) => {
          connection.release();
          if (err) {
            return res.status(500).send('Error updating user');
          }
          res.redirect('/'); // Redirect to home after successful update
        });
      });
    });
  });








app.get('/api/loginFlag', (req, res) => {
  res.json({ loginFlag: global.loginFlag });
});

app.get('/api/adminFlag', (req, res) => {
  res.json({ adminFlag: global.adminFlag, userName: global.userName });
});

app.get('/api/managerFlag', (req, res) => {
  res.json({ managerFlag: global.managerFlag, userName: global.userName });
});



// test to see if mysql is connected
database.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit the application if there is a connection error
  } else {
    console.log('Connected to the MySQL database.');
    connection.release();
  }
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', rsvpRouter); // Use the RSVP router for /api path

module.exports = app;
