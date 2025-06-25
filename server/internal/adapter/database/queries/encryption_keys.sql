-- name: CreateUserEncryptionKey :one
INSERT INTO user_encryption_keys (user_id, key_version, wrapped_dek, salt)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetActiveUserEncryptionKey :one
SELECT * FROM user_encryption_keys
WHERE user_id = $1 AND is_active = TRUE
ORDER BY key_version DESC
LIMIT 1;

-- name: GetUserEncryptionKeyByVersion :one
SELECT * FROM user_encryption_keys
WHERE user_id = $1 AND key_version = $2;

-- name: GetUserEncryptionKeys :many
SELECT * FROM user_encryption_keys
WHERE user_id = $1
ORDER BY key_version DESC;

-- name: DeactivateOldUserEncryptionKeys :exec
UPDATE user_encryption_keys
SET is_active = FALSE
WHERE user_id = $1 AND key_version < $2;

-- name: RotateUserEncryptionKey :one
WITH new_key AS (
    INSERT INTO user_encryption_keys (user_id, key_version, wrapped_dek, salt)
    VALUES ($1, $2, $3, $4)
    RETURNING *
),
deactivate_old AS (
    UPDATE user_encryption_keys
    SET is_active = FALSE
    WHERE user_id = $1 AND key_version < $2
)
SELECT * FROM new_key; 