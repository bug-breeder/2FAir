-- Drop the existing unique constraint
ALTER TABLE otps DROP CONSTRAINT otps_user_id_issuer_label_key;

-- Create a partial unique constraint that only applies to active records
-- This allows the same issuer+label combination to exist multiple times if inactive
CREATE UNIQUE INDEX otps_user_id_issuer_label_active_key 
ON otps (user_id, issuer, label) 
WHERE active = true; 