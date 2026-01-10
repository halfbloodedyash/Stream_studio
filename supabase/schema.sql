-- StreamStudio Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'ended')),
    settings JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rooms
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    invite_token VARCHAR(100) UNIQUE,
    role VARCHAR(50) DEFAULT 'guest' CHECK (role IN ('host', 'cohost', 'guest')),
    status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('invited', 'waiting', 'admitted', 'disconnected')),
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for participants
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_invite_token ON participants(invite_token);

-- Destinations table (for streaming platforms)
CREATE TABLE IF NOT EXISTS destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('youtube', 'facebook', 'twitch', 'linkedin', 'custom')),
    name VARCHAR(255) NOT NULL,
    rtmp_url TEXT NOT NULL,
    stream_key TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'idle' CHECK (status IN ('idle', 'connecting', 'live', 'error')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for destinations
CREATE INDEX IF NOT EXISTS idx_destinations_user_id ON destinations(user_id);

-- Recordings table
CREATE TABLE IF NOT EXISTS recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_url TEXT NOT NULL,
    size_bytes BIGINT,
    duration INTEGER, -- in seconds
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for recordings
CREATE INDEX IF NOT EXISTS idx_recordings_room_id ON recordings(room_id);

-- Assets table (overlays, logos, backgrounds)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('overlay', 'logo', 'background', 'sound')),
    filename VARCHAR(255) NOT NULL,
    storage_url TEXT NOT NULL,
    size_bytes INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for assets
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- Enable Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Users can view their own rooms" ON rooms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rooms" ON rooms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rooms" ON rooms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rooms" ON rooms
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for participants (room owners can manage)
CREATE POLICY "Room owners can view participants" ON participants
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM rooms WHERE rooms.id = participants.room_id AND rooms.user_id = auth.uid())
    );

CREATE POLICY "Room owners can manage participants" ON participants
    FOR ALL USING (
        EXISTS (SELECT 1 FROM rooms WHERE rooms.id = participants.room_id AND rooms.user_id = auth.uid())
    );

-- RLS Policies for destinations
CREATE POLICY "Users can manage their own destinations" ON destinations
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for recordings
CREATE POLICY "Users can view recordings of their rooms" ON recordings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM rooms WHERE rooms.id = recordings.room_id AND rooms.user_id = auth.uid())
    );

CREATE POLICY "Users can manage recordings of their rooms" ON recordings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM rooms WHERE rooms.id = recordings.room_id AND rooms.user_id = auth.uid())
    );

-- RLS Policies for assets
CREATE POLICY "Users can manage their own assets" ON assets
    FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
