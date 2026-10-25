-- ClassPresenter database schema (PostgreSQL). Mirrors the Floot-managed schema.
-- Column names are snake_case; the app maps them to camelCase with Kysely's CamelCasePlugin.

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE presentation_source_type AS ENUM ('pptx', 'pdf', 'canva', 'google_slides');

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_email ON users (email);

CREATE TABLE user_passwords (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
  id             TEXT PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  last_accessed  TIMESTAMPTZ DEFAULT now(),
  expires_at     TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX idx_sessions_user_id ON sessions (user_id);

CREATE TABLE login_attempts (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  attempted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success       BOOLEAN DEFAULT false
);
CREATE INDEX login_attempts_cleanup_idx ON login_attempts (attempted_at) WHERE attempted_at IS NOT NULL;
CREATE INDEX login_attempts_email_fail_idx ON login_attempts (lower(email::text), attempted_at DESC) WHERE success = false;

CREATE TABLE oauth_accounts (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  provider          TEXT NOT NULL,
  provider_user_id  TEXT NOT NULL,
  provider_email    TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

CREATE TABLE oauth_states (
  id             SERIAL PRIMARY KEY,
  state          TEXT NOT NULL UNIQUE,
  code_verifier  TEXT NOT NULL,
  provider       TEXT NOT NULL,
  redirect_url   TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  expires_at     TIMESTAMPTZ NOT NULL
);

CREATE TABLE user_storage (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  quota_bytes  BIGINT NOT NULL DEFAULT 1073741824,
  used_bytes   BIGINT NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE presentations (
  id                        BIGSERIAL PRIMARY KEY,
  user_id                   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  source_type               presentation_source_type NOT NULL,
  original_file_name        TEXT,
  storage_path              TEXT,
  external_url              TEXT,
  file_size_bytes           BIGINT NOT NULL DEFAULT 0,
  slide_count               INTEGER NOT NULL DEFAULT 0,
  auto_advance              BOOLEAN NOT NULL DEFAULT false,
  last_presented_at         TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  audio_path                TEXT,
  audio_name                TEXT,
  audio_size_bytes          BIGINT NOT NULL DEFAULT 0,
  global_timer_mode         TEXT NOT NULL DEFAULT 'elapsed' CHECK (global_timer_mode = ANY (ARRAY['elapsed','countdown'])),
  global_countdown_seconds  INTEGER NOT NULL DEFAULT 0 CHECK (global_countdown_seconds >= 0 AND global_countdown_seconds <= 86400)
);
CREATE INDEX presentations_user_id_idx ON presentations (user_id);

CREATE TABLE slides (
  id                    BIGSERIAL PRIMARY KEY,
  presentation_id       BIGINT NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  slide_index           INTEGER NOT NULL,
  thumbnail_path        TEXT,
  thumbnail_size_bytes  BIGINT NOT NULL DEFAULT 0,
  timer_enabled         BOOLEAN NOT NULL DEFAULT false,
  duration_seconds      INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  audio_path            TEXT,
  audio_name            TEXT,
  audio_size_bytes      BIGINT NOT NULL DEFAULT 0,
  UNIQUE (presentation_id, slide_index)
);
CREATE INDEX slides_presentation_id_idx ON slides (presentation_id);
