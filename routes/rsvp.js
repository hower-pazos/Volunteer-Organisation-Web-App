const express = require('express');
const router = express.Router();

// get events 
router.get('/events', (req, res) => {
    req.pool.query('SELECT * FROM Events', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch events' });
        }
        res.json(results);
    });
});

// get details of events
router.get('/events/:eventId', (req, res) => {
    const eventId = req.params.eventId;
    const query = `
        SELECT Events.event_id, Events.event_name AS title, Events.event_desc AS description,
               Events.event_date AS date, Event_Location.street_num, Event_Location.street_name,
               Event_Location.city, Event_Location.state_region, Event_Location.postcode,
               Event_Location.country
        FROM Events
        JOIN Event_Location ON Events.location_id = Event_Location.location_id
        WHERE Events.event_id = ?
    `;
    req.pool.query(query, [eventId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch event details' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(results[0]);
    });
});

// Handle RSVP request
router.post('/events/:eventId/rsvp', (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.body.user_id;

    const query = 'INSERT INTO UserEvents (event_id, user_id, rsvp_status) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE rsvp_status = 1';
    req.pool.query(query, [eventId, userId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to RSVP to event' });
        }
        res.json({ success: true });
    });
});

module.exports = router;
