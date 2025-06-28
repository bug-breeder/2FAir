-- name: CreateDeviceSession :one
INSERT INTO device_sessions (
    user_id, device_fingerprint, device_name
)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, device_fingerprint)
DO UPDATE SET
    device_name = EXCLUDED.device_name,
    last_sync_at = NOW()
RETURNING *;

-- name: GetDeviceSession :one
SELECT * FROM device_sessions
WHERE user_id = $1 AND device_fingerprint = $2;

-- name: GetActiveDeviceSessionsByUserID :many
SELECT * FROM device_sessions
WHERE user_id = $1
ORDER BY last_sync_at DESC;

-- name: UpdateDeviceSessionLastSync :exec
UPDATE device_sessions
SET last_sync_at = NOW()
WHERE user_id = $1 AND device_fingerprint = $2;

-- name: CreateSyncOperation :one
INSERT INTO sync_operations (
    user_id, operation_type, entity_type, entity_id,
    operation_data, device_fingerprint
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetSyncOperationsSince :many
SELECT so.*, ds.device_name
FROM sync_operations so
LEFT JOIN device_sessions ds ON so.device_fingerprint = ds.device_fingerprint AND so.user_id = ds.user_id
WHERE so.user_id = $1 AND so.timestamp > $2
ORDER BY so.timestamp ASC;

-- name: GetLatestSyncTimestamp :one
SELECT COALESCE(MAX(timestamp), NOW()) as latest_timestamp
FROM sync_operations
WHERE user_id = $1; 