-- name: CreateWebAuthnCredential :one
INSERT INTO webauthn_credentials (
    user_id, credential_id, public_key, aaguid, clone_warning,
    attachment, transport, backup_eligible, backup_state, sign_count
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetWebAuthnCredentialByID :one
SELECT * FROM webauthn_credentials
WHERE credential_id = $1;

-- name: GetWebAuthnCredentialsByUserID :many
SELECT * FROM webauthn_credentials
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: UpdateWebAuthnCredentialSignCount :exec
UPDATE webauthn_credentials
SET sign_count = $2, last_used_at = NOW()
WHERE credential_id = $1;

-- name: UpdateWebAuthnCredentialCloneWarning :exec
UPDATE webauthn_credentials
SET clone_warning = $2
WHERE credential_id = $1;

-- name: DeleteWebAuthnCredential :exec
DELETE FROM webauthn_credentials
WHERE credential_id = $1 AND user_id = $2; 