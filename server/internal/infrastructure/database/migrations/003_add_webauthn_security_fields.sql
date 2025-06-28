-- +goose Up
-- Add missing WebAuthn security fields to webauthn_credentials table

-- Add AAGUID for authenticator identification
ALTER TABLE webauthn_credentials ADD COLUMN aaguid UUID;

-- Add clone detection and security fields
ALTER TABLE webauthn_credentials ADD COLUMN clone_warning BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE webauthn_credentials ADD COLUMN sign_count BIGINT NOT NULL DEFAULT 0;

-- Add attachment type (platform, cross-platform)
ALTER TABLE webauthn_credentials ADD COLUMN attachment VARCHAR(20);

-- Add backup capability flags
ALTER TABLE webauthn_credentials ADD COLUMN backup_eligible BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE webauthn_credentials ADD COLUMN backup_state BOOLEAN NOT NULL DEFAULT FALSE;

-- Add indexes for performance on new fields
CREATE INDEX idx_webauthn_credentials_aaguid ON webauthn_credentials(aaguid) WHERE aaguid IS NOT NULL;
CREATE INDEX idx_webauthn_credentials_clone_warning ON webauthn_credentials(clone_warning) WHERE clone_warning = TRUE;

-- +goose Down
-- Remove indexes
DROP INDEX IF EXISTS idx_webauthn_credentials_clone_warning;
DROP INDEX IF EXISTS idx_webauthn_credentials_aaguid;

-- Remove columns
ALTER TABLE webauthn_credentials DROP COLUMN IF EXISTS backup_state;
ALTER TABLE webauthn_credentials DROP COLUMN IF EXISTS backup_eligible;
ALTER TABLE webauthn_credentials DROP COLUMN IF EXISTS attachment;
ALTER TABLE webauthn_credentials DROP COLUMN IF EXISTS sign_count;
ALTER TABLE webauthn_credentials DROP COLUMN IF EXISTS clone_warning;
ALTER TABLE webauthn_credentials DROP COLUMN IF EXISTS aaguid; 