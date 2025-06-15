-- name: CreateUser :one
INSERT INTO users (username, email, display_name)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 AND is_active = TRUE;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 AND is_active = TRUE;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1 AND is_active = TRUE;

-- name: UpdateUserLastLogin :exec
UPDATE users
SET last_login_at = NOW()
WHERE id = $1;

-- name: UpdateUser :one
UPDATE users
SET username = COALESCE(sqlc.narg('username'), username),
    email = COALESCE(sqlc.narg('email'), email),
    display_name = COALESCE(sqlc.narg('display_name'), display_name)
WHERE id = $1
RETURNING *;

-- name: DeactivateUser :exec
UPDATE users
SET is_active = FALSE
WHERE id = $1; 