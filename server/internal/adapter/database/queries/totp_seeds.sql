-- name: CreateEncryptedTOTPSeed :one
INSERT INTO encrypted_totp_seeds (
    user_id, service_name, account_identifier, encrypted_secret,
    algorithm, digits, period, issuer, icon_url, is_active
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetEncryptedTOTPSeedByID :one
SELECT * FROM encrypted_totp_seeds
WHERE id = $1 AND user_id = $2 AND is_active = TRUE;

-- name: GetEncryptedTOTPSeedsByUserID :many
SELECT * FROM encrypted_totp_seeds
WHERE user_id = $1 AND is_active = TRUE
ORDER BY created_at DESC;

-- name: GetEncryptedTOTPSeedsByUserIDSince :many
SELECT * FROM encrypted_totp_seeds
WHERE user_id = $1 AND updated_at > $2 AND is_active = TRUE
ORDER BY updated_at ASC;

-- name: UpdateEncryptedTOTPSeed :one
UPDATE encrypted_totp_seeds
SET service_name = COALESCE(sqlc.narg('service_name'), service_name),
    account_identifier = COALESCE(sqlc.narg('account_identifier'), account_identifier),
    encrypted_secret = COALESCE(sqlc.narg('encrypted_secret'), encrypted_secret),
    algorithm = COALESCE(sqlc.narg('algorithm'), algorithm),
    digits = COALESCE(sqlc.narg('digits'), digits),
    period = COALESCE(sqlc.narg('period'), period),
    issuer = COALESCE(sqlc.narg('issuer'), issuer),
    icon_url = COALESCE(sqlc.narg('icon_url'), icon_url),
    updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND is_active = TRUE
RETURNING *;

-- name: DeleteEncryptedTOTPSeed :exec
UPDATE encrypted_totp_seeds
SET is_active = FALSE, updated_at = NOW()
WHERE id = $1 AND user_id = $2;

-- name: SearchEncryptedTOTPSeeds :many
SELECT * FROM encrypted_totp_seeds
WHERE user_id = $1 AND is_active = TRUE
    AND (
        issuer ILIKE '%' || $2 || '%'
        OR service_name ILIKE '%' || $2 || '%'
        OR account_identifier ILIKE '%' || $2 || '%'
    )
ORDER BY created_at DESC;

-- name: UpdateTOTPSeedSyncTimestamp :exec
UPDATE encrypted_totp_seeds
SET updated_at = NOW()
WHERE id = $1 AND user_id = $2;

-- name: GetTOTPSeedsCountByUser :one
SELECT COUNT(*) FROM encrypted_totp_seeds
WHERE user_id = $1 AND is_active = TRUE; 