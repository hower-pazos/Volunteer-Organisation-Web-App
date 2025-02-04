DROP SCHEMA IF EXISTS project_database;
CREATE SCHEMA project_database;
USE project_database;

DROP USER IF EXISTS 'admin'@'localhost';

-- Replace 'your_actual_db_username' and 'your_actual_db_password' with your actual credentials
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin123';

-- Grant all privileges on the project_database to this user
GRANT ALL PRIVILEGES ON project_database.* TO 'admin'@'localhost';

-- Flush privileges to ensure the changes take effect
FLUSH PRIVILEGES;




-- addresses table
CREATE TABLE Addresses (
    address_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    street_num SMALLINT UNSIGNED NOT NULL,
    street_name VARCHAR(45) NOT NULL,
    city VARCHAR(45) NOT NULL,
    state_region VARCHAR(45) NOT NULL,
    postcode SMALLINT UNSIGNED NOT NULL,
    country VARCHAR(45) NOT NULL,
    PRIMARY KEY (address_id)
);

-- branches table
CREATE TABLE Branches (
    branch_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    branch_name VARCHAR(50) NOT NULL,
    branch_desc VARCHAR(200) NOT NULL,
    PRIMARY KEY (branch_id)
);

-- SigningOptions table
CREATE TABLE SigningOptions (
    signing_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    signing_type VARCHAR(50) NOT NULL,
    PRIMARY KEY (signing_id)
);

-- users table
CREATE TABLE Users (
    user_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    pass_word VARCHAR(200) NOT NULL,
    email_address VARCHAR(70) NOT NULL,
    role_permission VARCHAR(20) NOT NULL DEFAULT 'user',
    email_notifications BOOLEAN DEFAULT 0,
    phone_number VARCHAR(20) DEFAULT NULL,
    signing_id SMALLINT UNSIGNED,
    address_id SMALLINT UNSIGNED,
    branch_id SMALLINT UNSIGNED,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_users_addresses FOREIGN KEY (address_id) REFERENCES Addresses(address_id),
    CONSTRAINT fk_users_branches FOREIGN KEY (branch_id) REFERENCES Branches(branch_id),
    CONSTRAINT fk_users_signingOptions FOREIGN KEY (signing_id) REFERENCES SigningOptions(signing_id)
);

-- admin table
CREATE TABLE Admin (
    user_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    branch_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_admin_branches FOREIGN KEY (branch_id) REFERENCES Branches(branch_id),
    CONSTRAINT fk_admin_users FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- event Location
CREATE TABLE Event_Location (
    location_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    street_num SMALLINT UNSIGNED NOT NULL,
    street_name VARCHAR(45) NOT NULL,
    city VARCHAR(45) NOT NULL,
    state_region VARCHAR(45) NOT NULL,
    postcode SMALLINT UNSIGNED NOT NULL,
    country VARCHAR(45) NOT NULL,
    PRIMARY KEY (location_id)
);

-- Events
CREATE TABLE Events (
    event_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    event_name VARCHAR(50) NOT NULL,
    event_desc VARCHAR(200) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    branch_id SMALLINT UNSIGNED NOT NULL,
    location_id SMALLINT UNSIGNED NOT NULL,
    user_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (event_id),
    CONSTRAINT fk_events_branches FOREIGN KEY (branch_id) REFERENCES Branches(branch_id),
    CONSTRAINT fk_events_location FOREIGN KEY (location_id) REFERENCES Event_Location(location_id),
    CONSTRAINT fk_events_users FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- user events
CREATE TABLE UserEvents (
    userEvent_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    rsvp_status SMALLINT UNSIGNED DEFAULT 0,
    user_id SMALLINT UNSIGNED NOT NULL,
    event_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (userEvent_id),
    CONSTRAINT fk_userEvents_users FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT fk_userEvents_events FOREIGN KEY (event_id) REFERENCES Events(event_id)
);

-- Posts
CREATE TABLE Posts (
    post_id SMALLINT UNSIGNED NOT NULL UNIQUE AUTO_INCREMENT,
    post_title VARCHAR(100) NOT NULL,
    post_content VARCHAR(200) NOT NULL,
    post_time TIMESTAMP NOT NULL,
    visibility BOOLEAN DEFAULT 0,
    user_id SMALLINT UNSIGNED NOT NULL,
    branch_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (post_id),
    CONSTRAINT fk_posts_users FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT fk_posts_branches FOREIGN KEY (branch_id) REFERENCES Branches(branch_id)
);



-- EMAILS
-- Create a table to log event changes
CREATE TABLE EventChanges (
    change_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    event_id SMALLINT UNSIGNED NOT NULL,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (change_id),
    FOREIGN KEY (event_id) REFERENCES Events(event_id)
);

-- New ecents
CREATE TABLE EventLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id SMALLINT UNSIGNED,
    processed BOOLEAN DEFAULT FALSE
);

DELIMITER //
CREATE TRIGGER after_event_insert
AFTER INSERT ON Events
FOR EACH ROW
BEGIN
    INSERT INTO EventLog (event_id, processed) VALUES (NEW.event_id, FALSE);
END //
DELIMITER ;



-- for the deletion of branches

-- Drop existing foreign key constraints
ALTER TABLE Admin DROP FOREIGN KEY fk_admin_branches;
ALTER TABLE Events DROP FOREIGN KEY fk_events_branches;
ALTER TABLE UserEvents DROP FOREIGN KEY fk_userEvents_events;
ALTER TABLE Posts DROP FOREIGN KEY fk_posts_branches;
ALTER TABLE Users DROP FOREIGN KEY fk_users_branches;

-- Add new foreign key constraints with ON DELETE CASCADE or SET NULL
ALTER TABLE Admin
ADD CONSTRAINT fk_admin_branches
FOREIGN KEY (branch_id)
REFERENCES Branches(branch_id)
ON DELETE CASCADE;

ALTER TABLE Events
ADD CONSTRAINT fk_events_branches
FOREIGN KEY (branch_id)
REFERENCES Branches(branch_id)
ON DELETE CASCADE;

ALTER TABLE UserEvents
ADD CONSTRAINT fk_userEvents_events
FOREIGN KEY (event_id)
REFERENCES Events(event_id)
ON DELETE CASCADE;

ALTER TABLE Posts
ADD CONSTRAINT fk_posts_branches
FOREIGN KEY (branch_id)
REFERENCES Branches(branch_id)
ON DELETE CASCADE;

ALTER TABLE Users
ADD CONSTRAINT fk_users_branches
FOREIGN KEY (branch_id)
REFERENCES Branches(branch_id)
ON DELETE SET NULL;



DELIMITER $$

CREATE TRIGGER AfterEventUpdate
AFTER UPDATE ON Events
FOR EACH ROW
BEGIN
    INSERT INTO EventChanges(event_id, update_time)
    VALUES (NEW.event_id, NOW());
END $$

DELIMITER ;



-- Insert data
SET AUTOCOMMIT=0;

-- Inserting data into Addresses
INSERT INTO Addresses VALUES
(1, 123, 'George St', 'Sydney', 'New South Wales', 2000, 'Australia'),
(2, 456, 'Queen St', 'Brisbane', 'Queensland', 4000, 'Australia'),
(3, 789, 'Collins St', 'Melbourne', 'Victoria', 3000, 'Australia'),
(4, 101, 'Rundle Mall', 'Adelaide', 'South Australia', 5000, 'Australia'),
(5, 202, 'Hay St', 'Perth', 'Western Australia', 6000, 'Australia');
COMMIT;

SET AUTOCOMMIT=0;

-- Inserting data into SigningOptions
INSERT INTO SigningOptions VALUES
(1, 'Event updates'),
(2, 'Special events');
COMMIT;

SET AUTOCOMMIT=0;

-- Inserting data into Branches
INSERT INTO Branches VALUES
(1, 'Southern Cross Care', 'Volunteering with Southern Cross Care is a fun and rewarding way to make new friends, feel part of a team and use your skills to give back to your community.'),
(2, 'Volunteering Australia', 'Volunteering Australia Inc. was founded in 1997 under the National Secretariat Program and is the peak body for volunteering in Australia.'),
(3, 'Volunteering SA & NT', 'Volunteering SA&NT is the go-to organisation for volunteering in South Australia and the Northern Territory.');
COMMIT;

SET AUTOCOMMIT=0;

-- Inserting data into Users
-- admin password: $2b$04$4RlaqwOKLQkFBFIFeo0fGeUYpB1tIprdb6JdoJAkP0oQWhVw0a1Zi = 123
INSERT INTO Users (user_id, first_name, last_name, username, pass_word, email_address, role_permission, email_notifications, phone_number, signing_id, address_id, branch_id) VALUES
(1, 'John', 'Dickson', 'john_dickson', 'password123', 'john@example.com', 'user', 1, '0433465895', 1, 1, 1),
(2, 'Jane', 'Foster', 'jane_foster', 'password456', 'jane@example.com', 'admin', 1, '0434567890', 1, 2, 2),
(3, 'Mike', 'Miles', 'mike_miles', 'password789', 'mike@example.com', 'user', 1, '0412345678', 1, 3, 1),
(4, 'Emily', 'Stone', 'emily_stone', 'password101', 'emily@example.com', 'user', 0, '0423456789', 1, 4, 2),
(5, 'Sarah', 'Mejia', 'sarah_mejia', 'password202', 'sarah@example.com', 'user', 0, '0412345670', 1, 5, 3),
(6, 'admin', 'admin', 'admin_user', '$2b$04$4RlaqwOKLQkFBFIFeo0fGeUYpB1tIprdb6JdoJAkP0oQWhVw0a1Zi', 'admin@example.com', 'admin', 0, '0411222333', 1, 5, 1),
(7, 'manager', 'manager', 'manager_user', '$2b$04$4RlaqwOKLQkFBFIFeo0fGeUYpB1tIprdb6JdoJAkP0oQWhVw0a1Zi', 'manager@example.com', 'manager', 0, '0411222334', 1, 5, 1);
COMMIT;
SET AUTOCOMMIT=0;



-- Inserting data into Admin
INSERT INTO Admin VALUES
(1, 1),
(2, 2);
COMMIT;

SET AUTOCOMMIT=0;

-- Inserting data into Event_Location
-- Insert records into Event_Location table
INSERT INTO Event_Location (location_id, street_num, street_name, city, state_region, postcode, country) VALUES
(1, 123, 'Central Park Rd', 'Adelaide', 'SA', 5000, 'Australia'),  -- Central Park
(2, 456, 'Community Center St', 'Adelaide', 'SA', 5000, 'Australia'),  -- Community Center
(3, 789, 'Riverside Park Ave', 'Adelaide', 'SA', 5000, 'Australia'),  -- Riverside Park
(4, 101, 'Downtown Blvd', 'Adelaide', 'SA', 5000, 'Australia'),  -- Downtown
(5, 202, 'Adelaide Hills', 'Adelaide', 'SA', 5000, 'Australia'),  -- Adelaide Hills
(6, 303, 'Virginia', 'Virginia', 'VA', 5000, 'Australia'),  -- Virginia
(7, 404, 'Adelaide Hills', 'Adelaide', 'SA', 5000, 'Australia'),  -- Adelaide Hills
(8, 505, 'Adelaide CBD', 'Adelaide', 'SA', 5000, 'Australia'),  -- Adelaide CBD
(9, 606, 'Henley Beach Rd', 'Adelaide', 'SA', 5000, 'Australia'),  -- Henley Beach
(10, 707, 'Adelaide Hills Rd', 'Adelaide', 'SA', 5000, 'Australia');  -- Adelaide Hills
COMMIT;
SET AUTOCOMMIT=0;

-- Inserting data into Events
INSERT INTO Events (event_id, event_name, event_desc, event_date, branch_id, location_id, user_id) VALUES
(1, 'Cleanup', 'Join us for a community cleanup event to make our neighborhood cleaner and greener.', '2024-06-15 00:00:00', 1, 1, 6),
(2, 'Food Drive', 'Help us collect and distribute food to those in need in our community.', '2024-06-20 00:00:00', 1, 2, 6),
(3, 'Tree Planting', 'Join our tree planting event to contribute to a greener environment.', '2024-06-25 00:00:00', 1, 3, 6),
(4, 'Charity Run', 'Participate in our charity run to raise funds for local shelters.', '2024-06-30 00:00:00', 1, 4, 6),
(5, 'Planting Trees in the Adelaide Hills', 'Help us re-plant some new trees that have been burnt down in a recent bushfire.', '2024-06-17 00:00:00', 2, 5, 6),
(6, 'Constructing Community Housing', 'Help struggling families build their new homes and learn useful construction skills.', '2024-06-22 00:00:00', 2, 6, 6),
(7, 'Help feed the Kangaroos', 'Help feed our Kangaroos in our newly built conservation park where our team of environmentalists help preserve nature.', '2024-06-26 00:00:00', 2, 7, 6),
(8, 'Volunteer at our next charity marathon', 'Help us raise funds and support our runners by handing out drinks and snacks for our marathon runners.', '2024-06-18 00:00:00', 3, 8, 6),
(9, 'Beach Cleanup', 'Clean up the trash that is littering our beautiful beaches and help make the environment a better place for everyone.', '2024-06-29 00:00:00', 3, 9, 6),
(10, 'Disaster Relief 101', 'Learn from the best in helping dealing with bushfires alongside other environmental disasters and hazards.', '2024-07-01 00:00:00', 3, 10, 6);
COMMIT;
SET AUTOCOMMIT=0;

-- Inserting data into UserEvents
INSERT INTO UserEvents VALUES
(1, 0, 1, 1),
(2, 0, 2, 2),
(3, 0, 3, 1),
(4, 0, 4, 2),
(5, 0, 5, 1);
COMMIT;

SET AUTOCOMMIT=0;

-- Inserting data into Posts
INSERT INTO Posts (post_id, post_title, post_content, post_time, visibility, user_id, branch_id) VALUES
(1, 'Welcome to the organization!', 'Congratulations on finally joining the Organisation.', '2024-06-01 12:00:00', 0, 1, 1),
(2, 'Annual Meeting is coming!', 'Every year we hold a meeting to congratulate our new and existing members.', '2024-06-02 14:00:00', 1, 2, 1),
(3, 'New training session available!', 'Join our new training session to learn new invaluable skills to further your career.', '2024-06-03 09:00:00', 1, 3, 2);

COMMIT;
