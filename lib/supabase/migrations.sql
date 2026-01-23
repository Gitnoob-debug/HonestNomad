-- HonestNomad Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    preferences JSONB DEFAULT '{}'
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    state JSONB DEFAULT '{"stage": "gathering_info"}',
    preferences JSONB DEFAULT '{}',
    last_search_results JSONB DEFAULT '[]',
    user_agent TEXT,
    ip_country TEXT
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    input_tokens INTEGER,
    output_tokens INTEGER
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duffel_booking_id TEXT NOT NULL UNIQUE,
    duffel_order_id TEXT,
    hotel_name TEXT NOT NULL,
    hotel_id TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    room_type TEXT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    commission_amount DECIMAL(10, 2),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    duffel_response JSONB,
    itinerary JSONB
);

-- Itineraries table
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    content JSONB NOT NULL,
    user_edits JSONB DEFAULT '[]',
    preferences_used JSONB,
    generation_model TEXT
);

-- Search logs table
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_params JSONB NOT NULL,
    results_count INTEGER,
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    response_time_ms INTEGER,
    raw_response JSONB
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_bookings_duffel_id ON bookings(duffel_booking_id);
CREATE INDEX idx_bookings_email ON bookings(guest_email);
CREATE INDEX idx_bookings_conversation_id ON bookings(conversation_id);
CREATE INDEX idx_itineraries_booking_id ON itineraries(booking_id);
CREATE INDEX idx_itineraries_conversation_id ON itineraries(conversation_id);
CREATE INDEX idx_search_logs_conversation_id ON search_logs(conversation_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER itineraries_updated_at
    BEFORE UPDATE ON itineraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Create profile on user signup (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for service role and triggers"
    ON profiles FOR INSERT
    WITH CHECK (true);

-- Conversations policies
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert conversations"
    ON conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations
            WHERE user_id = auth.uid() OR user_id IS NULL
        )
    );

CREATE POLICY "Anyone can insert messages"
    ON messages FOR INSERT
    WITH CHECK (true);

-- Bookings policies
CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations
            WHERE user_id = auth.uid()
        )
        OR guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Anyone can insert bookings"
    ON bookings FOR INSERT
    WITH CHECK (true);

-- Itineraries policies
CREATE POLICY "Users can view own itineraries"
    ON itineraries FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations
            WHERE user_id = auth.uid()
        )
        OR booking_id IN (
            SELECT id FROM bookings
            WHERE conversation_id IN (
                SELECT id FROM conversations WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Anyone can insert itineraries"
    ON itineraries FOR INSERT
    WITH CHECK (true);

-- Search logs policies (service role only - no public access)
CREATE POLICY "Service role only for search_logs"
    ON search_logs FOR ALL
    USING (false);

-- Grant service role full access (bypass RLS)
-- Note: Service role automatically bypasses RLS in Supabase

-- =============================================
-- Draft Trips table (for abandoned cart recovery)
-- =============================================

CREATE TABLE draft_trips (
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
CREATE INDEX idx_draft_trips_user_id ON draft_trips(user_id);
CREATE INDEX idx_draft_trips_updated_at ON draft_trips(updated_at DESC);

-- Updated_at trigger for draft_trips
CREATE TRIGGER draft_trips_updated_at
    BEFORE UPDATE ON draft_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE draft_trips ENABLE ROW LEVEL SECURITY;

-- RLS policies for draft_trips
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
