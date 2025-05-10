CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_id)
);

CREATE TABLE otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  label TEXT NOT NULL,
  secret TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  digits INTEGER NOT NULL,
  period INTEGER NOT NULL,
  counter INTEGER NOT NULL,
  method TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, issuer, label)
);

CREATE TABLE login_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL
);

CREATE TABLE issuers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  help_url TEXT,
  image_uri TEXT,
  digits INTEGER NOT NULL DEFAULT 6,
  period INTEGER NOT NULL DEFAULT 30,
  default_counter INTEGER NOT NULL DEFAULT 0,
  algorithm TEXT NOT NULL DEFAULT 'SHA1',
  method TEXT NOT NULL DEFAULT 'totp'
);
