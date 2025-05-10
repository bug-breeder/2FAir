-- name: AddLoginEvent :one
INSERT INTO login_events (
  user_id,
  ip_address,
  user_agent
) VALUES (
  $1, $2, $3
) RETURNING *;

-- name: GetLoginEventByID :one
SELECT * FROM login_events WHERE id = $1 AND user_id = $2 LIMIT 1;

-- name: RemoveLoginEvent :exec
DELETE FROM login_events WHERE id = $1 AND user_id = $2;

-- name: ListLoginEvents :many
SELECT * FROM login_events WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2;