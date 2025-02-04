/* eslint-disable no-console */
const nodemailer = require('nodemailer');
const mysql = require('mysql');

// Setup database connection
const db = mysql.createConnection({
    host: 'localhost',
    database: 'project_database'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// Email transport configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'ike47@ethereal.email',
        pass: 'uj2yJ9ZEJeCw1qRkSb'
    }
});

// Function for sending email
const sendEmail = (recipient, eventDetails) => {
    const mailOptions = {
        from: 'VOLUNTEER ORGANISATION <no-reply@volunteer.org>',
        to: recipient.email_address,
        subject: eventDetails.subject,
        text: eventDetails.text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error sending email: ', error);
        }
        console.log('Message sent: %s', info.messageId);
    });
};

// Function to check EventLog for new events
const checkEventLog = () => {
    db.query('SELECT EventLog.log_id, Events.event_id, Events.event_name, Events.branch_id FROM EventLog JOIN Events ON EventLog.event_id = Events.event_id WHERE EventLog.processed = FALSE', (err, results) => {
        if (err) {
            console.error('Error fetching event log:', err);
            return;
        }

        results.forEach(event => {
            // Fetch users associated with the event's branch
            db.query('SELECT email_address, first_name FROM Users WHERE branch_id = ?', [event.branch_id], (err, users) => {
                if (err) {
                    console.error('Error fetching users:', err);
                    return;
                }

                users.forEach(user => {
                    if (user && user.email_address) {
                        const subjectLine = 'New Event Created';
                        const messageText = `Dear ${user.first_name},\n\nA new event "${event.event_name}" has been created. Log in now to see the details and join!`;

                        sendEmail({
                            email_address: user.email_address,
                            first_name: user.first_name
                        }, {
                            event_name: event.event_name,
                            subject: subjectLine,
                            text: messageText
                        });
                    }
                });

                // Mark the event log as processed
                db.query('UPDATE EventLog SET processed = TRUE WHERE log_id = ?', [event.log_id], (err) => {
                    if (err) {
                        console.error('Error updating EventLog:', err);
                    } else {
                        console.log('Processed event log_id:', event.log_id);
                    }
                });
            });
        });
    });
};

// Monitor EventLog table for new entries
setInterval(checkEventLog, 6000);

// Monitor EventChanges table for updates
setInterval(() => {
    db.query('SELECT EventChanges.*, Events.event_name, Events.branch_id FROM EventChanges JOIN Events ON EventChanges.event_id = Events.event_id', (err, results) => {
        if (err) {
            console.error('Error fetching event changes:', err);
            return;
        }

        if (!results || results.length === 0) {
            console.log('No changes detected.');
            return;
        }

        results.forEach(change => {
            if (change && change.change_id) {
                // Fetch users with branch
                db.query('SELECT email_address, first_name FROM Users WHERE branch_id = ?', [change.branch_id], (err, users) => {
                    if (err) {
                        console.error('Error fetching users:', err);
                        return;
                    }

                    users.forEach(user => {
                        if (user && user.email_address) {
                            const subjectLine = 'Event Update';
                            const messageText = `Dear ${user.first_name},\n\nThere has been an update to the event "${change.event_name}". Log in now to view the full details!`;

                            sendEmail({
                                email_address: user.email_address,
                                first_name: user.first_name
                            }, {
                                event_name: change.event_name,
                                subject: subjectLine,
                                text: messageText
                            });
                        }
                    });
                });

                // Clear processed changes
                db.query('DELETE FROM EventChanges WHERE change_id = ?', [change.change_id], (err) => {
                    if (err) {
                        console.error('Error clearing EventChanges:', err);
                    } else {
                        console.log('Processed and cleared change_id:', change.change_id);
                    }
                });
            }
        });
    });
}, 5000);
