CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE accounts (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  username_normalized citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  principal_id uuid NOT NULL UNIQUE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  username text,
  guest boolean NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);
CREATE TABLE ratings (
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  season_id text NOT NULL,
  elo integer NOT NULL DEFAULT 1000,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  PRIMARY KEY(account_id, season_id)
);
CREATE TABLE active_activities (
  principal_id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('queue','ready_check','room','match')),
  reference_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE queues (
  id uuid PRIMARY KEY,
  principal_id uuid NOT NULL UNIQUE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  username text,
  guest boolean NOT NULL,
  game_id text NOT NULL,
  season_id text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('casual','ranked')),
  rating integer NOT NULL,
  joined_at timestamptz NOT NULL
);
CREATE INDEX queues_match_idx ON queues(game_id, season_id, mode, joined_at);
CREATE TABLE rooms (
  id uuid PRIMARY KEY,
  invite_code char(6) NOT NULL UNIQUE,
  owner_principal_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('open','started')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE room_members (
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  principal_id uuid NOT NULL UNIQUE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  username text,
  guest boolean NOT NULL,
  ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL,
  PRIMARY KEY(room_id, principal_id)
);
CREATE TABLE matches (
  id uuid PRIMARY KEY,
  game_id text NOT NULL,
  season_id text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('casual','ranked','room')),
  status text NOT NULL CHECK (status IN ('ready_check','playing','finished')),
  seed text NOT NULL,
  rules_version text NOT NULL,
  ready_deadline timestamptz,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE TABLE match_players (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  principal_id uuid NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  username text,
  guest boolean NOT NULL,
  side text NOT NULL CHECK(side IN ('ct','t')),
  accepted boolean NOT NULL DEFAULT false,
  PRIMARY KEY(match_id, principal_id),
  UNIQUE(match_id, side)
);
CREATE TABLE match_commands (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  principal_id uuid NOT NULL,
  command_id text NOT NULL,
  sequence bigint NOT NULL,
  command jsonb NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(match_id, command_id),
  UNIQUE(match_id, sequence)
);
CREATE INDEX match_commands_retention_idx ON match_commands(accepted_at);
CREATE TABLE match_rating_settlements (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  old_elo integer NOT NULL,
  new_elo integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(match_id, account_id)
);
