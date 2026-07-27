-- Find the new family
SELECT hf.family_id, u.full_name, hf.verification_status
FROM HostFamilies hf
INNER JOIN Users u ON hf.user_id = u.user_id
WHERE u.email = 'kofi.family@test.com';

-- Approve them
UPDATE HostFamilies
SET verification_status = 'APPROVED',
    verified_at = CURRENT_TIMESTAMP,
    verified_by = 1
WHERE family_id = (
    SELECT hf.family_id 
    FROM HostFamilies hf
    INNER JOIN Users u ON hf.user_id = u.user_id
    WHERE u.email = 'kofi.family@test.com'
);