-- name: CreateDeviceSession :one
INSERT INTO device_sessions (
    user_id, device_id, device_name, device_type,
    user_agent, ip_address, expires_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (user_id, device_id)
DO UPDATE SET
    device_name = EXCLUDED.device_name,
    device_type = EXCLUDED.device_type,
    user_agent = EXCLUDED.user_agent,
    ip_address = EXCLUDED.ip_address,
    last_sync_at = NOW(),
    expires_at = EXCLUDED.expires_at,
    is_active = TRUE
RETURNING *;

-- name: GetDeviceSession :one
SELECT * FROM device_sessions
WHERE user_id = $1 AND device_id = $2 AND is_active = TRUE;

-- name: GetActiveDeviceSessionsByUserID :many
SELECT * FROM device_sessions
WHERE user_id = $1 AND is_active = TRUE AND expires_at > NOW()
ORDER BY last_sync_at DESC;

-- name: UpdateDeviceSessionLastSync :exec
UPDATE device_sessions
SET last_sync_at = NOW()
WHERE user_id = $1 AND device_id = $2;

-- name: DeactivateDeviceSession :exec
UPDATE device_sessions
SET is_active = FALSE
WHERE user_id = $1 AND device_id = $2;

-- name: CleanupExpiredDeviceSessions :exec
UPDATE device_sessions
SET is_active = FALSE
WHERE expires_at <= NOW();

-- name: CreateSyncOperation :one
INSERT INTO sync_operations (
    user_id, device_session_id, operation_type,
    resource_type, resource_id, timestamp_vector
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetSyncOperationsSince :many
SELECT so.*, ds.device_id, ds.device_name
FROM sync_operations so
LEFT JOIN device_sessions ds ON so.device_session_id = ds.id
WHERE so.user_id = $1 AND so.timestamp_vector > $2
ORDER BY so.timestamp_vector ASC;

-- name: GetLatestSyncTimestamp :one
SELECT COALESCE(MAX(timestamp_vector), 0) as latest_timestamp
FROM sync_operations
WHERE user_id = $1; 