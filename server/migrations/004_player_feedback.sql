CREATE TABLE IF NOT EXISTS player_feedback (
  id uuid PRIMARY KEY,
  game_id text NOT NULL CHECK (game_id = 'cs-career'),
  category text NOT NULL CHECK (category IN ('bug','balance','content','ui','other')),
  message varchar(2000) NOT NULL CHECK (char_length(btrim(message)) BETWEEN 5 AND 2000),
  phase varchar(32),
  save_version integer,
  rules_version varchar(160),
  client_version varchar(32),
  principal_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS player_feedback_created_at_idx ON player_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS player_feedback_principal_time_idx ON player_feedback(principal_id,created_at DESC);
