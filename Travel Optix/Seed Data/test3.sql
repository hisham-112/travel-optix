-- Check current password hash for Kofi
SELECT user_id, full_name, email, 
       LEFT(password_hash, 20) AS hash_preview
FROM Users
WHERE email = 'kofi.boateng@gmail.com';