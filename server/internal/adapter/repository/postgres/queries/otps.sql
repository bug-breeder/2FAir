-- name: ListOTPs :many
SELECT * FROM otps WHERE user_id = $1 AND active = true;

-- name: AddOTP :one
INSERT INTO otps (
  user_id,
  issuer,
  label,
  secret,
  algorithm,
  digits,
  period,
  counter,
  method,
  active
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: InactivateOTP :one
UPDATE otps
SET active = false
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: EditOTP :one
UPDATE otps
SET 
  issuer = $3,
  label = $4,
  secret = $5,
  algorithm = $6,
  digits = $7,
  period = $8,
  counter = $9,
  method = $10
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: GetOTP :one
SELECT * FROM otps WHERE id = $1 AND user_id = $2 LIMIT 1;