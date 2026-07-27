-- Update ALL seed users with correct 
-- BCrypt hash for "password123"
UPDATE Users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh8S'
WHERE email IN (
    'admin@traveloptix.com',
    'james.mensah@gmail.com',
    'sarah.osei@gmail.com',
    'kwame.asante@gmail.com',
    'abena.darko@gmail.com',
    'kofi.boateng@gmail.com',
    'ama.owusu@gmail.com'
);