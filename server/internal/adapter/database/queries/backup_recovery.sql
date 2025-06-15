-- name: CreateBackupRecoveryCode :one
INSERT INTO backup_recovery_codes (user_id, encrypted_recovery_blob, salt, hint)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetActiveBackupRecoveryCode :one
SELECT * FROM backup_recovery_codes
WHERE user_id = $1 AND is_active = TRUE
ORDER BY created_at DESC
LIMIT 1;

-- name: GetBackupRecoveryCodeByID :one
SELECT * FROM backup_recovery_codes
WHERE id = $1 AND user_id = $2 AND is_active = TRUE;

-- name: UseBackupRecoveryCode :exec
UPDATE backup_recovery_codes
SET used_at = NOW(), is_active = FALSE
WHERE id = $1 AND user_id = $2;

-- name: DeactivateOldBackupRecoveryCodes :exec
UPDATE backup_recovery_codes
SET is_active = FALSE
WHERE user_id = $1 AND id != $2;

-- name: CreateAuditLog :one
INSERT INTO audit_logs (
    user_id, device_session_id, event_type,
    event_details, ip_address, user_agent
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetAuditLogsByUserID :many
SELECT * FROM audit_logs
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetAuditLogsByEventType :many
SELECT * FROM audit_logs
WHERE event_type = $1
    AND created_at >= $2
    AND created_at <= $3
ORDER BY created_at DESC
LIMIT $4 OFFSET $5;

-- name: GetRecentAuditLogs :many
SELECT al.*, u.username, u.email, ds.device_name
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN device_sessions ds ON al.device_session_id = ds.id
WHERE al.created_at >= $1
ORDER BY al.created_at DESC
LIMIT $2 OFFSET $3; 