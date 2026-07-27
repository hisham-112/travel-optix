-- Users
CREATE INDEX idx_users_email
    ON Users(email);

CREATE INDEX idx_users_phone
    ON Users(phone);

CREATE INDEX idx_users_role
    ON Users(role);

-- Tourists
CREATE INDEX idx_tourists_pass
    ON Tourists(travel_pass_code);

-- Bookings
CREATE INDEX idx_bookings_tourist
    ON Bookings(tourist_id);

CREATE INDEX idx_bookings_type_ref
    ON Bookings(booking_type, reference_id);

CREATE INDEX idx_bookings_status
    ON Bookings(status);

-- Payments
CREATE INDEX idx_payment_status
    ON Payments(payment_status);

-- Notifications
CREATE INDEX idx_notif_user
    ON Notifications(user_id, is_read);

-- Emergency Contacts
CREATE INDEX idx_emergency_tourist
    ON EmergencyContacts(tourist_id, is_primary);

-- Events
CREATE INDEX idx_events_family
    ON Events(family_id);

CREATE INDEX idx_events_date
    ON Events(event_date);