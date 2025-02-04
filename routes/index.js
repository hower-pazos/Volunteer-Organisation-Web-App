/* eslint-disable no-console */

var express = require('express');
var router = express.Router();
var dotenv = require('dotenv');
var bcrypt = require('bcrypt'); // hashing algorithm for passwords

dotenv.config();

var session = require('express-session');
const passport = require('passport');

// Initialize express app
var app = express();

// Session and Passport setup
app.use(session({ secret: 'SECRET', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).send('Unauthorized');
  }
}


// Route to handle registration
router.post('/register', (req, res) => {
  const {
    first_name,
    last_name,
    email,
    username,
    password,
    confirm_password,
    phone_number,
    street_number,
    address_line_1,
    suburb,
    state,
    post_code
  } = req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  const hashedPassword = bcrypt.hashSync(password, 2); // Only 2 salt rounds

  req.pool.getConnection((error, connection) => {
    if (error) {
      console.error('Error getting database connection:', error);
      return res.status(500).send('Error getting database connection');
    }

    // Insert the address first
    const addressQuery = 'INSERT INTO Addresses (street_num, street_name, city, state_region, postcode, country) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(addressQuery, [street_number, address_line_1, suburb, state, post_code, 'Australia'], (err, addressResult) => {
      if (err) {
        connection.release();
        console.error('Error inserting address:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      const addressId = addressResult.insertId;

      // Insert the user with the address_id
      const userQuery = 'INSERT INTO Users (first_name, last_name, email_address, username, pass_word, phone_number, address_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
      connection.query(userQuery, [first_name, last_name, email, username, hashedPassword, phone_number, addressId], (err, userResult) => {
        connection.release();

        if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json({ success: true, message: 'User registered successfully' });
      });
    });
  });
});



router.post('/login', (req, res, next) => {
  const email_or_username = req.body.email_or_username;
  const password = req.body.password;

  req.pool.getConnection(function (error, connection) {
    if (error) {
      res.status(500).send('Error getting database connection:');
      return;
    }
    const query = 'SELECT * FROM Users WHERE (email_address = ? OR username = ?)';
    connection.query(query, [email_or_username, email_or_username], (err, results) => {
      connection.release(); // Release the connection back to the pool

      if (err) {
        res.status(500).send('Error executing query:');
        return;
      }

      if (results.length > 0) {
        const user = results[0];

        if (bcrypt.compareSync(password, user.pass_word)) {
          req.session.userId = user.user_id;
          req.session.username = user.username;
          req.session.branch_id =user.branch_id;
          global.loginFlag = true;   // Setting global variable to true as per successful login
          global.userName = user.username;
          global.adminFlag = false;
          global.managerFlag = false;

          if (user.role_permission == 'admin') {
            global.adminFlag = true;
          } else if (user.role_permission == 'manager') {
            global.managerFlag = true;
          }

          res.json({ success: true, message: 'Login successful', redirectUrl: '/dashboard.html' });
        } else {
          res.json({ success: false, message: 'Invalid email/username or password' });
        }
      } else {
        res.json({ success: false, message: 'Invalid email/username or password' });
      }
    });
  });
});

// route to handle logging the user out
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    global.loginFlag = false;
    global.adminFlag = false;
    global.managerFlag = false;
    global.userName = '';

    res.json({ success: true, message: 'Logout successful', redirectUrl: '/login.html' });
  });
});

// fetch the current user for the purposes of viewing members of the same branch
router.get('/api/current_user', (req, res) => {
  const userId = req.session.userId; // Get user_id from session

  if (!userId) {
    res.status(401).send('User not logged in');
    return;
  }

  req.pool.getConnection((error, connection) => {
    if (error) {
      res.status(500).send('Error getting database connection');
      return;
    }

    const query = 'SELECT branch_id FROM Users WHERE user_id = ?';
    connection.query(query, [userId], (err, results) => {
      connection.release();

      if (err) {
        res.status(500).send('Error fetching user details');
        return;
      }
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).send('User not found');
      }
    });
  });
});


//
// populate dashboard with all users from database
//
router.get('/api/users', (req, res) => {
  const query = `
    SELECT u.user_id, u.first_name, u.last_name, u.username, u.email_address, u.role_permission, u.email_notifications, u.phone_number, u.branch_id, b.branch_name
    FROM Users u
    LEFT JOIN Branches b ON u.branch_id = b.branch_id
  `;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.query(query, (error, results) => {
      connection.release();

      if (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Server error');
      } else {
        res.json(results);
      }
    });
  });
});


//
//
// add a user
router.post('/api/users', (req, res) => {
  const { first_name, last_name, username, pass_word, email_address, role_permission, email_notifications, phone_number, branch_name } = req.body;
  const hashedPassword = bcrypt.hashSync(pass_word, 2); // Hash the password

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    // First, get the branch_id from the branch_name
    const query = 'SELECT branch_id FROM Branches WHERE branch_name = ?';
    connection.query(query, [branch_name], (error, results) => {
      if (error) {
        connection.release();
        return res.status(500).send('Error executing query:');
      }

      if (results.length === 0) {
        connection.release();
        return res.status(400).send('Branch not found');
      }

      const branch_id = results[0].branch_id;

      const insertQuery = `
        INSERT INTO Users (first_name, last_name, username, pass_word, email_address, role_permission, email_notifications, phone_number, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(insertQuery, [first_name, last_name, username, hashedPassword, email_address, role_permission, email_notifications, phone_number, branch_id], (error, results) => {
        connection.release();

        if (error) {
          console.error('Error adding user:', error);
          res.status(500).send('Server error');
        } else {
          res.status(201).json({ success: true, userId: results.insertId });
        }
      });
    });
  });
});


//
//
// update a user
router.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, username, email_address, role_permission, email_notifications, phone_number, branch_name } = req.body;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    // First, get the branch_id from the branch_name
    const query = 'SELECT branch_id FROM Branches WHERE branch_name = ?';
    connection.query(query, [branch_name], (error, results) => {
      if (error) {
        connection.release();
        return res.status(500).send('Error executing query:');
      }

      if (results.length === 0) {
        connection.release();
        return res.status(400).send('Branch not found');
      }

      const branch_id = results[0].branch_id;

      const updateQuery = `
        UPDATE Users SET first_name = ?, last_name = ?, username = ?, email_address = ?, role_permission = ?, email_notifications = ?, phone_number = ?, branch_id = ?
        WHERE user_id = ?
      `;

      connection.query(updateQuery, [first_name, last_name, username, email_address, role_permission, email_notifications, phone_number, branch_id, id], (error, results) => {
        connection.release();

        if (error) {
          console.error('Error updating user:', error);
          res.status(500).send('Server error');
        } else {
          res.json({ success: true });
        }
      });
    });
  });
});

// delete a user
//
//
router.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM Users WHERE user_id = ?';

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.query(query, [id], (error, results) => {
      connection.release();

      if (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server error');
      } else {
        res.json({ success: true });
      }
    });
  });
});


//
// dashboard profile
//
router.get('/api/user-profile', (req, res) => {
  const userId = req.session.userId; // Assuming the user ID is stored in the session

  if (!userId) {
    return res.status(401).send('User not logged in');
  }

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    const query = `
          SELECT u.username, u.phone_number, u.email_address, u.role_permission, u.email_notifications,
                 a.street_num, a.street_name, a.city, a.state_region, a.postcode, a.country,
                 b.branch_name
          FROM Users u
          LEFT JOIN Addresses a ON u.address_id = a.address_id
          LEFT JOIN Branches b ON u.branch_id = b.branch_id
          WHERE u.user_id = ?
      `;

    connection.query(query, [userId], (err, results) => {
      connection.release();

      if (err) {
        return res.status(500).send('Error fetching user data');
      }

      if (results.length > 0) {
        const user = results[0];
        res.json(user);
      } else {
        res.status(404).send('User not found');
      }
    });
  });
});

//
// update user's profile information on the dashboard
//
router.post('/api/update_user', (req, res) => {
  const { username, phone, street_num, street_name, city, state_region, postcode, country, email_notifications } = req.body;
  const userId = req.session.userId; // Assuming userId is stored in session

  const insertAddressQuery = `
    INSERT INTO Addresses (street_num, street_name, city, state_region, postcode, country)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      street_name = VALUES(street_name),
      city = VALUES(city),
      state_region = VALUES(state_region),
      postcode = VALUES(postcode),
      country = VALUES(country)
  `;

  const updateUserQuery = `
    UPDATE Users
    JOIN Addresses ON Addresses.street_num = ? AND Addresses.street_name = ? AND Addresses.city = ? AND Addresses.state_region = ? AND Addresses.postcode = ? AND Addresses.country = ?
    SET Users.username = ?, Users.phone_number = ?, Users.email_notifications = ?, Users.address_id = Addresses.address_id
    WHERE Users.user_id = ?
  `;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return res.status(500).send('Error starting transaction');
      }

      connection.query(insertAddressQuery, [street_num, street_name, city, state_region, postcode, country], (error, results) => {
        if (error) {
          return connection.rollback(() => {
            connection.release();
            console.error('Error inserting/updating address:', error);
            res.status(500).send('Server error');
          });
        }

        connection.query(updateUserQuery, [street_num, street_name, city, state_region, postcode, country, username, phone, email_notifications, userId], (error, results) => {
          if (error) {
            return connection.rollback(() => {
              connection.release();
              console.error('Error updating user:', error);
              res.status(500).send('Server error');
            });
          }

          connection.commit(err => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).send('Error committing transaction');
              });
            }

            connection.release();
            res.json({ success: true });
          });
        });
      });
    });
  });
});




// populate dashboard with members
router.get('/api/members', (req, res) => {
  const branchId = req.query.branch_id; // Get branch_id from query parameters
  req.pool.getConnection((error, connection) => {
    if (error) {
      res.status(500).send('Error getting database connection');
      return;
    }

    const query = `
      SELECT first_name AS name, role_permission AS role, email_address AS email
      FROM Users
      WHERE branch_id = ?
    `;
    connection.query(query, [branchId], (err, results) => {
      connection.release();

      if (err) {
        res.status(500).send('Error fetching members');
        return;
      }
      res.json(results);
    });
  });
});

// route to fetch branch name for the Manage Users tab
//
//
router.get('/api/branches-for-users', (req, res) => {
  const query = 'SELECT branch_id, branch_name FROM Branches';

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.query(query, (error, results) => {
      connection.release();

      if (error) {
        console.error('Error fetching branches:', error);
        res.status(500).send('Server error');
      } else {
        res.json(results);
      }
    });
  });
});


// fetch branches from the database for the dashboard
router.get('/api/branches', (req, res) => {
  req.pool.getConnection((error, connection) => {
    if (error) {
      res.status(500).send('Error getting database connection');
      return;
    }

    const query = 'SELECT branch_name, branch_desc FROM Branches';
    connection.query(query, (err, results) => {
      connection.release();

      if (err) {
        res.status(500).send('Error fetching branches');
        return;
      }
      res.json(results);
    });
  });
});

// add branches
//
//
router.post('/api/branches', (req, res) => {
  const { branch_name, branch_desc } = req.body;

  const query = `
    INSERT INTO Branches (branch_name, branch_desc)
    VALUES (?, ?)
  `;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.query(query, [branch_name, branch_desc], (error, results) => {
      connection.release();

      if (error) {
        console.error('Error adding branch:', error);
        res.status(500).send('Server error');
      } else {
        res.status(201).json({ success: true, branchId: results.insertId });
      }
    });
  });
});

// update branches
//
//
router.put('/api/branches/:name', (req, res) => {
  const { name } = req.params;
  const { branch_name, branch_desc } = req.body;

  const getBranchIdQuery = 'SELECT branch_id FROM Branches WHERE branch_name = ?';
  const updateBranchQuery = `
    UPDATE Branches SET branch_name = ?, branch_desc = ?
    WHERE branch_id = ?
  `;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    // First, get the branch_id based on branch_name
    connection.query(getBranchIdQuery, [name], (error, results) => {
      if (error) {
        connection.release();
        console.error('Error fetching branch ID:', error);
        return res.status(500).send('Server error');
      }

      if (results.length === 0) {
        connection.release();
        return res.status(404).send('Branch not found');
      }

      const branchId = results[0].branch_id;

      // Then, update the branch information
      connection.query(updateBranchQuery, [branch_name, branch_desc, branchId], (error, results) => {
        connection.release();

        if (error) {
          console.error('Error updating branch:', error);
          res.status(500).send('Server error');
        } else {
          res.json({ success: true });
        }
      });
    });
  });
});


// delete branches
//
//
router.delete('/api/branches/:name', (req, res) => {
  const { name } = req.params;

  const getBranchIdQuery = 'SELECT branch_id FROM Branches WHERE branch_name = ?';
  const deleteBranchQuery = 'DELETE FROM Branches WHERE branch_id = ?';

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    // First, get the branch_id based on branch_name
    connection.query(getBranchIdQuery, [name], (error, results) => {
      if (error) {
        connection.release();
        console.error('Error fetching branch ID:', error);
        return res.status(500).send('Server error');
      }

      if (results.length === 0) {
        connection.release();
        return res.status(404).send('Branch not found');
      }

      const branchId = results[0].branch_id;

      // Then, delete the branch
      connection.query(deleteBranchQuery, [branchId], (error, results) => {
        connection.release();

        if (error) {
          console.error('Error deleting branch:', error);
          res.status(500).send('Server error');
        } else {
          res.json({ success: true });
        }
      });
    });
  });
});




// embedded events display
router.get('/api/events', (req, res) => {
  req.pool.getConnection((error, connection) => {
    if (error) {
      res.status(500).send('Error getting database connection');
      return;
    }

    const query = `
          SELECT Events.event_id, Events.event_name AS title, Events.event_desc AS description,
                 Events.event_date AS date, Event_Location.street_num, Event_Location.street_name,
                 Event_Location.city, Event_Location.state_region, Event_Location.postcode,
                 Event_Location.country, Branches.branch_name, Users.first_name, Users.last_name
          FROM Events
          JOIN Event_Location ON Events.location_id = Event_Location.location_id
          JOIN Branches ON Events.branch_id = Branches.branch_id
          JOIN Users ON Events.user_id = Users.user_id
      `;
    connection.query(query, (err, results) => {
      connection.release();

      if (err) {
        res.status(500).send('Error fetching events');
        return;
      }
      res.json(results);
    });
  });
});

// dashboard events
// router.get('/api/events-dashboard', (req, res) => {
//   const userId = req.session.userId;

//   if (!userId) {
//     return res.status(401).send('User not logged in');
//   }

//   req.pool.getConnection((error, connection) => {
//     if (error) {
//       return res.status(500).send('Error getting database connection');
//     }

//     const query = `
//           SELECT e.event_name AS title, e.event_date AS date, e.event_desc AS description,
//                  l.location_id, l.street_num, l.street_name, l.city, l.state_region, l.postcode, l.country
//           FROM Events e
//           JOIN Event_Location l ON e.location_id = l.location_id
//           JOIN Users u ON e.branch_id = u.branch_id
//           WHERE u.user_id = ?
//       `;

//     connection.query(query, [userId], (err, results) => {
//       connection.release();

//       if (err) {
//         return res.status(500).send('Error fetching events');
//       }

//       res.json(results);
//     });
//   });
// });

// Get all events
router.get('/api/events-dashboard', (req, res) => {
  const userId = req.session.userId;

  req.pool.getConnection((error, connection) => {
      if (error) {
          return res.status(500).send('Error getting database connection');
      }

      const userQuery = 'SELECT branch_id FROM Users WHERE user_id = ?';
      connection.query(userQuery, [userId], (error, results) => {
          if (error) {
              connection.release();
              return res.status(500).send('Error fetching user branch ID');
          }

          const userBranchId = results[0].branch_id;
          const eventsQuery = `
              SELECT e.event_id, e.event_name, e.event_date, e.event_desc, CONCAT(l.street_num, ' ', l.street_name, ', ', l.city, ', ', l.state_region, ', ', l.postcode, ', ', l.country) AS location
              FROM Events e
              JOIN Event_Location l ON e.location_id = l.location_id
              WHERE e.branch_id = ?
              ORDER BY e.event_date DESC
          `;

          connection.query(eventsQuery, [userBranchId], (error, results) => {
              connection.release(); // Release the connection back to the pool

              if (error) {
                  console.error('Error fetching events:', error);
                  res.status(500).send('Server error');
              } else {
                  res.json(results);
              }
          });
      });
  });
});


// Add a new event
// Add a new event
router.post('/api/events', (req, res) => {
  const { event_title, event_desc, event_date, event_street_num, event_street_name, event_city, event_state_region, event_postcode, event_country } = req.body;
  const userBranchId = req.session.branch_id;
  const userId = req.session.userId;

  if (!userId || !userBranchId) {
      return res.status(400).json({ error: 'User not logged in or branch ID missing' });
  }

  const locationQuery = `
      INSERT INTO Event_Location (street_num, street_name, city, state_region, postcode, country)
      VALUES (?, ?, ?, ?, ?, ?)
  `;
  const locationValues = [event_street_num, event_street_name, event_city, event_state_region, event_postcode, event_country];

  req.pool.getConnection((error, connection) => {
      if (error) {
          console.error('Database connection error:', error);
          return res.status(500).json({ error: 'Database connection error' });
      }

      connection.query(locationQuery, locationValues, (locationError, locationResult) => {
          if (locationError) {
              connection.release();
              console.error('Failed to add event location:', locationError);
              return res.status(500).json({ error: 'Failed to add event location' });
          }

          const locationId = locationResult.insertId;
          const eventQuery = `
              INSERT INTO Events (event_name, event_desc, event_date, branch_id, location_id, user_id)
              VALUES (?, ?, ?, ?, ?, ?)
          `;
          const eventValues = [event_title, event_desc, event_date, userBranchId, locationId, userId];

          connection.query(eventQuery, eventValues, (eventError, eventResult) => {
              connection.release();

              if (eventError) {
                  console.error('Failed to add event:', eventError);
                  return res.status(500).json({ error: 'Failed to add event' });
              }
              res.json({ success: true });
          });
      });
  });
});

// Edit an event
router.put('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  const { event_title, event_desc, event_date, event_street_num, event_street_name, event_city, event_state_region, event_postcode, event_country } = req.body;

  const locationQuery = `
      UPDATE Event_Location l
      JOIN Events e ON l.location_id = e.location_id
      SET l.street_num = ?, l.street_name = ?, l.city = ?, l.state_region = ?, l.postcode = ?, l.country = ?
      WHERE e.event_id = ?
  `;
  const locationValues = [event_street_num, event_street_name, event_city, event_state_region, event_postcode, event_country, eventId];

  req.pool.getConnection((error, connection) => {
      if (error) {
          return res.status(500).send('Error getting database connection');
      }

      connection.query(locationQuery, locationValues, (locationError) => {
          if (locationError) {
              connection.release();
              return res.status(500).json({ error: 'Failed to update event location' });
          }

          const eventQuery = `
              UPDATE Events SET event_name = ?, event_desc = ?, event_date = ?
              WHERE event_id = ?
          `;
          const eventValues = [event_title, event_desc, event_date, eventId];

          connection.query(eventQuery, eventValues, (eventError) => {
              connection.release();

              if (eventError) {
                  return res.status(500).json({ error: 'Failed to update event' });
              }
              res.json({ success: true });
          });
      });
  });
});


// Delete an event
router.delete('/api/events/:id', (req, res) => {
  const eventId = req.params.id;

  const query = 'DELETE FROM Events WHERE event_id = ?';
  req.pool.getConnection((error, connection) => {
      if (error) {
          return res.status(500).send('Error getting database connection');
      }

      connection.query(query, [eventId], (error) => {
          connection.release();

          if (error) {
              console.error('Error deleting event:', error);
              res.status(500).send('Server error');
          } else {
              res.json({ success: true });
          }
      });
  });
});


// Update events
router.post('/api/updateEvent/:eventId', (req, res) => {
  const eventId = req.params.eventId;
  const { event_name, event_desc, event_date, street_num, street_name, city, state_region, postcode, country } = req.body;
  const userId = req.session.userId; // Assuming userId is stored in session after login

  if (!userId) {
    return res.status(401).json({ success: false, message: 'User not logged in' });
  }

  req.pool.getConnection((error, connection) => {
    if (error) {
      console.error('Error getting database connection', error);
      return res.status(500).send('Error getting database connection');
    }
      const updateQuery = 'UPDATE Events SET event_name = ?, event_desc = ?, event_date = ?, street_num = ?, street_name = ?, city = ?, state_region = ?, postcode = ?, country = ? WHERE event_id = ?';
      connection.query(updateQuery, [event_name, event_desc, event_date, street_num, street_name, city, state_region, postcode, country, eventId], (error, updateResult) => {
        connection.release();

        if (error) {
          console.error('Error updating event:', error);
          return res.status(500).json({ success: false, message: 'Error updating event' });
        }

        res.json({ success: true, message: 'Event updated successfully' });
      });
    });
  });



//
// posts.html embedded script
//

router.get('/api/posts', (req, res) => {
  const userBranchId = req.session.branch_id;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    const query = `
      SELECT p.post_id, p.post_title, p.post_content, p.post_time, p.visibility, u.username, b.branch_name
      FROM Posts p
      JOIN Users u ON p.user_id = u.user_id
      JOIN Branches b ON p.branch_id = b.branch_id
      WHERE p.visibility = 1 OR u.branch_id = ?
      ORDER BY p.post_time DESC
    `;

    connection.query(query, [userBranchId], (error, results) => {
      connection.release(); // Release the connection back to the pool

      if (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send('Server error');
      } else {
        // Filter posts to only include those with visibility = 1
        const visiblePosts = results.filter(post => post.visibility === 1);
        res.json(visiblePosts);
      }
    });
  });
});


// posts in the dashboard for managers
//
//
//
router.get('/api/posts-dashboard', (req, res) => {
  const userId = req.session.userId;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    const userQuery = 'SELECT branch_id FROM Users WHERE user_id = ?';
    connection.query(userQuery, [userId], (error, results) => {
      if (error) {
        connection.release();
        return res.status(500).send('Error fetching user branch ID');
      }

      const userBranchId = results[0].branch_id;
      const postsQuery = `
        SELECT p.post_id, p.post_title, p.post_content, p.post_time, p.visibility, u.username, b.branch_name
        FROM Posts p
        JOIN Users u ON p.user_id = u.user_id
        JOIN Branches b ON p.branch_id = b.branch_id
        WHERE p.visibility = 1 OR p.branch_id = ?
        ORDER BY p.post_time DESC
      `;

      connection.query(postsQuery, [userBranchId], (error, results) => {
        connection.release(); // Release the connection back to the pool

        if (error) {
          console.error('Error fetching posts:', error);
          res.status(500).send('Server error');
        } else {
          res.json(results);
        }
      });
    });
  });
});

// Add a new post
router.post('/api/posts', (req, res) => {
  const { post_title, post_content, post_visibility } = req.body;
  const visibility = post_visibility ? 1 : 0; // Convert checkbox value to 1 or 0
  const userId = req.session.userId;  // Assuming userId is stored in session
  const branchId = req.session.branch_id; // Assuming branchId is stored in session

  const query = `
    INSERT INTO Posts (post_title, post_content, post_time, visibility, user_id, branch_id)
    VALUES (?, ?, NOW(), ?, ?, ?)
  `;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.query(query, [post_title, post_content, visibility, userId, branchId], (error, results) => {
      connection.release();

      if (error) {
        console.error('Error adding post:', error);
        res.status(500).send('Server error');
      } else {
        res.status(201).json({ success: true, postId: results.insertId });
      }
    });
  });
});


// Update an existing post
router.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { post_title, post_content, post_visibility } = req.body;
  const visibility = post_visibility ? 1 : 0; // Convert checkbox value to 1 or 0

  const query = `
    UPDATE Posts SET post_title = ?, post_content = ?, visibility = ?
    WHERE post_id = ?
  `;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.query(query, [post_title, post_content, visibility, id], (error, results) => {
      connection.release();

      if (error) {
        console.error('Error updating post:', error);
        res.status(500).send('Server error');
      } else {
        res.json({ success: true });
      }
    });
  });
});


// Delete a post
router.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    DELETE FROM Posts WHERE post_id = ?
  `;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.query(query, [id], (error, results) => {
      connection.release();

      if (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('Server error');
      } else {
        res.json({ success: true });
      }
    });
  });
});



// join a branch
//
router.post('/api/join-branch', (req, res) => {
  const userId = req.session.userId; // Assuming the user is logged in and you have the user ID in the session
  const { branchId } = req.body;

  if (!userId) {
    return res.status(401).send('User not logged in');
  }

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    const query = 'UPDATE Users SET branch_id = ? WHERE user_id = ?';
    connection.query(query, [branchId, userId], (error, results) => {
      connection.release();
      if (error) {
        return res.status(500).send('Error updating branch_id');
      }
      res.json({ success: true });
    });
  });
});

//
// get emails from branch
//
// Route to update email_permissions
router.post('/api/update-email-permissions', (req, res) => {
  const userId = req.session.userId; // Assuming the user is logged in and you have the user ID in the session

  if (!userId) {
      return res.status(401).send('User not logged in');
  }

  req.pool.getConnection((error, connection) => {
      if (error) {
          return res.status(500).send('Error getting database connection');
      }

      const query = 'UPDATE Users SET email_notifications = 1 WHERE user_id = ?';
      connection.query(query, [userId], (error, results) => {
          connection.release();
          if (error) {
              return res.status(500).send('Error updating email_permissions');
          }
          res.json({ success: true });
      });
  });
});

// adding new branches via dashboard
//
//
router.post('/api/branches', (req, res) => {
  const { branch_name, branch_desc } = req.body;

  req.pool.getConnection((error, connection) => {
      if (error) {
          return res.status(500).send('Error getting database connection');
      }

      const query = 'INSERT INTO Branches (branch_name, branch_desc) VALUES (?, ?)';
      connection.query(query, [branch_name, branch_desc], (error, results) => {
          connection.release();
          if (error) {
              return res.status(500).send('Error adding branch');
          }
          res.json({ success: true });
      });
  });
});

//
//
// Edit a branch
router.put('/api/branches/:branch_id', (req, res) => {
  const { branch_id } = req.params;
  const { branch_name, branch_desc } = req.body;

  req.pool.getConnection((error, connection) => {
      if (error) {
          return res.status(500).send('Error getting database connection');
      }

      const query = 'UPDATE Branches SET branch_name = ?, branch_desc = ? WHERE branch_id = ?';
      connection.query(query, [branch_name, branch_desc, branch_id], (error, results) => {
          connection.release();
          if (error) {
              return res.status(500).send('Error editing branch');
          }
          res.json({ success: true });
      });
  });
});

//
//
// Delete a branch
router.delete('/api/events/:event_id', (req, res) => {
  const { event_id } = req.params;

  const query = `
    DELETE FROM Events WHERE event_id = ?
  `;

  req.pool.getConnection((error, connection) => {
    if (error) {
      return res.status(500).send('Error getting database connection');
    }

    connection.query(query, [event_id], (error, results) => {
      connection.release();

      if (error) {
        console.error('Error deleting event:', error);
        res.status(500).send('Server error');
      } else {
        res.json({ success: true });
      }
    });
  });
});


router.get('/api/managerFlag', (req, res) => {
  res.json({ managerFlag: global.managerFlag, userName: global.userName });
});


router.get('/dashboard.html', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login.html');
  }
  res.send(`Welcome ${req.session.username}, to your dashboard!`);
});

module.exports = router;



