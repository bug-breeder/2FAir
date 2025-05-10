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
  label = $3,
  secret = $4,
  algorithm = $5,
  digits = $6,
  period = $7,
  counter = $8,
  method = $9
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: GetOTP :one
SELECT * FROM otps WHERE id = $1 AND user_id = $2 LIMIT 1;