-- name: CreateEncryptedTOTPSeed :one
INSERT INTO encrypted_totp_seeds (
    user_id, key_version, ciphertext, iv, auth_tag,
    issuer, account_name, icon_url, tags
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetEncryptedTOTPSeedByID :one
SELECT * FROM encrypted_totp_seeds
WHERE id = $1 AND user_id = $2;

-- name: GetEncryptedTOTPSeedsByUserID :many
SELECT * FROM encrypted_totp_seeds
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: GetEncryptedTOTPSeedsByUserIDSince :many
SELECT * FROM encrypted_totp_seeds
WHERE user_id = $1 AND updated_at > $2
ORDER BY updated_at ASC;

-- name: UpdateEncryptedTOTPSeed :one
UPDATE encrypted_totp_seeds
SET ciphertext = COALESCE(sqlc.narg('ciphertext'), ciphertext),
    iv = COALESCE(sqlc.narg('iv'), iv),
    auth_tag = COALESCE(sqlc.narg('auth_tag'), auth_tag),
    issuer = COALESCE(sqlc.narg('issuer'), issuer),
    account_name = COALESCE(sqlc.narg('account_name'), account_name),
    icon_url = COALESCE(sqlc.narg('icon_url'), icon_url),
    tags = COALESCE(sqlc.narg('tags'), tags),
    synced_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteEncryptedTOTPSeed :exec
DELETE FROM encrypted_totp_seeds
WHERE id = $1 AND user_id = $2;

-- name: SearchEncryptedTOTPSeeds :many
SELECT * FROM encrypted_totp_seeds
WHERE user_id = $1
    AND (
        issuer ILIKE '%' || $2 || '%'
        OR account_name ILIKE '%' || $2 || '%'
        OR $2 = ANY(tags)
    )
ORDER BY created_at DESC;

-- name: UpdateTOTPSeedSyncTimestamp :exec
UPDATE encrypted_totp_seeds
SET synced_at = NOW()
WHERE id = $1 AND user_id = $2;

-- name: GetTOTPSeedsCountByUser :one
SELECT COUNT(*) FROM encrypted_totp_seeds
WHERE user_id = $1; 