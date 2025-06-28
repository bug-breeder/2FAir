-- +goose Up
-- Create linking_codes table for device linking functionality
CREATE TABLE linking_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code VARCHAR(12) NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_linking_codes_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_linking_codes_user_id ON linking_codes(user_id);
CREATE INDEX idx_linking_codes_code ON linking_codes(code);
CREATE INDEX idx_linking_codes_expires_at ON linking_codes(expires_at);

-- Composite index for common queries
CREATE INDEX idx_linking_codes_user_active ON linking_codes(user_id, is_used, expires_at) 
    WHERE is_used = FALSE;

-- +goose Down
-- Drop indexes first
DROP INDEX IF EXISTS idx_linking_codes_user_active;
DROP INDEX IF EXISTS idx_linking_codes_is_used;
DROP INDEX IF EXISTS idx_linking_codes_expires_at;
DROP INDEX IF EXISTS idx_linking_codes_code;
DROP INDEX IF EXISTS idx_linking_codes_user_id;

-- Drop table
DROP TABLE IF EXISTS linking_codes; 