-- name: CreateUser :exec
INSERT INTO users (
    id, username, email, display_name, created_at, updated_at, last_login_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
);

-- name: GetUserByID :one
SELECT id, username, email, display_name, created_at, updated_at, last_login_at
FROM users 
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, username, email, display_name, created_at, updated_at, last_login_at
FROM users 
WHERE email = $1;

-- name: GetUserByUsername :one
SELECT id, username, email, display_name, created_at, updated_at, last_login_at
FROM users 
WHERE username = $1;

-- name: UpdateUser :exec
UPDATE users 
SET username = $2, email = $3, display_name = $4, updated_at = $5, last_login_at = $6
WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users 
WHERE id = $1;

-- name: ListUsers :many
SELECT id, username, email, display_name, created_at, updated_at, last_login_at
FROM users 
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountUsers :one
SELECT COUNT(*) FROM users;

-- name: UpdateLastLogin :exec
UPDATE users 
SET last_login_at = $2, updated_at = $3
WHERE id = $1; 