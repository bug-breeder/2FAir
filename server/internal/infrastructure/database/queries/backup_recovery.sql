-- name: CreateBackupRecoveryCode :one
INSERT INTO backup_recovery_codes (user_id, encrypted_backup_data, recovery_code_hash)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetActiveBackupRecoveryCode :one
SELECT * FROM backup_recovery_codes
WHERE user_id = $1 AND is_used = FALSE
ORDER BY created_at DESC
LIMIT 1;

-- name: GetBackupRecoveryCodeByID :one
SELECT * FROM backup_recovery_codes
WHERE id = $1 AND user_id = $2 AND is_used = FALSE;

-- name: UseBackupRecoveryCode :exec
UPDATE backup_recovery_codes
SET used_at = NOW(), is_used = TRUE
WHERE id = $1 AND user_id = $2;

-- name: CreateAuditLog :one
INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id,
    metadata, ip_address, user_agent
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetAuditLogsByUserID :many
SELECT * FROM audit_logs
WHERE user_id = $1
ORDER BY timestamp DESC
LIMIT $2 OFFSET $3;

-- name: GetAuditLogsByAction :many
SELECT * FROM audit_logs
WHERE action = $1
    AND timestamp >= $2
    AND timestamp <= $3
ORDER BY timestamp DESC
LIMIT $4 OFFSET $5;

-- name: GetRecentAuditLogs :many
SELECT al.*, u.username, u.email
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.timestamp >= $1
ORDER BY al.timestamp DESC
LIMIT $2 OFFSET $3; 