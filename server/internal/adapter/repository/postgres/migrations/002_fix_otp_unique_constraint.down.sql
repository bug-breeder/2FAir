-- Drop the partial unique index
DROP INDEX IF EXISTS otps_user_id_issuer_label_active_key;

-- Recreate the original unique constraint
ALTER TABLE otps ADD CONSTRAINT otps_user_id_issuer_label_key UNIQUE (user_id, issuer, label); 