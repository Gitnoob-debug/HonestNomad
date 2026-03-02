-- Booking Sessions table for OpenClaw agent flow
-- Stores hotel + destination + trip details as JSON
-- Tokens are single-use, 30-minute expiry UUIDs

CREATE TABLE IF NOT EXISTS booking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_data JSONB NOT NULL,
  destination_data JSONB NOT NULL,
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  guests_data JSONB NOT NULL,
  landmark_lat DOUBLE PRECISION NOT NULL,
  landmark_lng DOUBLE PRECISION NOT NULL,
  source TEXT NOT NULL DEFAULT 'openclaw',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index for token lookup (primary key already indexed)
-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_booking_sessions_expires_at
  ON booking_sessions (expires_at)
  WHERE used = FALSE;

-- Index for source tracking
CREATE INDEX IF NOT EXISTS idx_booking_sessions_source
  ON booking_sessions (source, created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE booking_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything (our API routes use service role)
CREATE POLICY "Service role full access"
  ON booking_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup: delete sessions older than 24 hours
-- Run via Supabase cron or pg_cron extension
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *',
--   $$DELETE FROM booking_sessions WHERE expires_at < NOW() - INTERVAL '24 hours'$$
-- );

COMMENT ON TABLE booking_sessions IS 'Single-use booking tokens for OpenClaw agent checkout flow';
COMMENT ON COLUMN booking_sessions.id IS 'UUID token used in booking URL: /book/{token}';
COMMENT ON COLUMN booking_sessions.hotel_data IS 'Full HotelOption JSON (price, photos, amenities, etc)';
COMMENT ON COLUMN booking_sessions.destination_data IS 'MatchedDestination JSON (city, country, highlights)';
COMMENT ON COLUMN booking_sessions.used IS 'TRUE after checkout page loads — prevents reuse';
