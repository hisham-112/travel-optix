-- This fixes all seed users so they can login
-- password for all will be "password123"
UPDATE Users SET password_hash = 
'$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email IN (
    'admin@traveloptix.com',
    'james.mensah@gmail.com',
    'sarah.osei@gmail.com',
    'kwame.asante@gmail.com',
    'abena.darko@gmail.com',
    'kofi.boateng@gmail.com',
    'ama.owusu@gmail.com'
);