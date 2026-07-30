ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rating double precision NOT NULL DEFAULT 1500;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS deviation double precision NOT NULL DEFAULT 350;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS volatility double precision NOT NULL DEFAULT 0.06;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS periods integer NOT NULL DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type text NOT NULL DEFAULT 'Private' CHECK (room_type IN ('Private','Matchmade','PVE'));
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_status_check;
ALTER TABLE rooms ADD CONSTRAINT rooms_status_check CHECK (status IN ('open','started','closed'));
ALTER TABLE match_rating_settlements ADD COLUMN IF NOT EXISTS old_rating double precision;
ALTER TABLE match_rating_settlements ADD COLUMN IF NOT EXISTS new_rating double precision;

CREATE TABLE IF NOT EXISTS match_proposals (
  match_id uuid PRIMARY KEY,
  entries jsonb NOT NULL,
  accepted uuid[] NOT NULL DEFAULT '{}',
  deadline timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1,
  retained_group_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS match_proposals_due_idx ON match_proposals(deadline);

CREATE TABLE IF NOT EXISTS room_chat (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  principal_id uuid NOT NULL,
  text varchar(240) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS room_chat_room_time_idx ON room_chat(room_id, created_at DESC);

CREATE TABLE IF NOT EXISTS room_deadlines (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  principal_id uuid,
  kind text NOT NULL,
  due_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1,
  priority integer NOT NULL DEFAULT 100,
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS room_deadlines_due_idx ON room_deadlines(due_at, priority) WHERE completed_at IS NULL;
