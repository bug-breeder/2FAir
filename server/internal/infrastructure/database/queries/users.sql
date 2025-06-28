-- name: CreateUser :one
INSERT INTO users (
    username, email, display_name
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users 
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users 
WHERE email = $1;

-- name: GetUserByUsername :one
SELECT * FROM users 
WHERE username = $1;

-- name: UpdateUser :one
UPDATE users 
SET username = $2, email = $3, display_name = $4, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateUserLastLogin :exec
UPDATE users 
SET last_login_at = NOW(), updated_at = NOW()
WHERE id = $1;

-- name: DeactivateUser :exec
UPDATE users 
SET is_active = FALSE, updated_at = NOW()
WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users 
WHERE id = $1;

-- name: ListUsers :many
SELECT * FROM users 
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountUsers :one
SELECT COUNT(*) FROM users; 