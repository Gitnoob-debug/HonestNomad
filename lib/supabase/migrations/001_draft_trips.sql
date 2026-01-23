-- =============================================
-- Draft Trips table (for abandoned cart recovery)
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS draft_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Trip identification
    destination_city TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,

    -- Full trip data (stored as JSONB for flexibility)
    trip_data JSONB NOT NULL,           -- FlashTripPackage
    itinerary JSONB NOT NULL DEFAULT '[]', -- ItineraryDay[]
    itinerary_type TEXT,                -- 'classic', 'foodie', etc.

    -- User selections
    favorites JSONB NOT NULL DEFAULT '[]',     -- Array of POI IDs
    favorite_stops JSONB NOT NULL DEFAULT '[]', -- Full POI data
    current_step TEXT DEFAULT 'itinerary',

    -- Unique constraint: one draft per user + destination + dates
    UNIQUE(user_id, destination_city, departure_date, return_date)
);

-- Indexes for draft_trips
CREATE INDEX IF NOT EXISTS idx_draft_trips_user_id ON draft_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_trips_updated_at ON draft_trips(updated_at DESC);

-- Updated_at trigger for draft_trips
CREATE OR REPLACE FUNCTION update_draft_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS draft_trips_updated_at ON draft_trips;
CREATE TRIGGER draft_trips_updated_at
    BEFORE UPDATE ON draft_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_draft_trips_updated_at();

-- Enable RLS
ALTER TABLE draft_trips ENABLE ROW LEVEL SECURITY;

-- RLS policies for draft_trips (drop first if they exist)
DROP POLICY IF EXISTS "Users can view own drafts" ON draft_trips;
DROP POLICY IF EXISTS "Users can insert own drafts" ON draft_trips;
DROP POLICY IF EXISTS "Users can update own drafts" ON draft_trips;
DROP POLICY IF EXISTS "Users can delete own drafts" ON draft_trips;

CREATE POLICY "Users can view own drafts"
    ON draft_trips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts"
    ON draft_trips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts"
    ON draft_trips FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts"
    ON draft_trips FOR DELETE
    USING (auth.uid() = user_id);
