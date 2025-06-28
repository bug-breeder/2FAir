-- name: CreateUserEncryptionKey :one
INSERT INTO user_encryption_keys (user_id, webauthn_credential_id, encrypted_dek, key_version)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetActiveUserEncryptionKey :one
SELECT * FROM user_encryption_keys
WHERE user_id = $1
ORDER BY key_version DESC
LIMIT 1;

-- name: GetUserEncryptionKeyByVersion :one
SELECT * FROM user_encryption_keys
WHERE user_id = $1 AND key_version = $2;

-- name: GetUserEncryptionKeys :many
SELECT * FROM user_encryption_keys
WHERE user_id = $1
ORDER BY key_version DESC;

-- name: GetUserEncryptionKeyByCredential :one
SELECT * FROM user_encryption_keys
WHERE user_id = $1 AND webauthn_credential_id = $2
ORDER BY key_version DESC
LIMIT 1; 