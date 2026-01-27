-- Phase 3 Migration: Rich Person Profiles

-- 1. Add Extended Metadata to Persons Table
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS nickname text,
ADD COLUMN IF NOT EXISTS birth_place text,
ADD COLUMN IF NOT EXISTS death_place text,
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS biography text,
ADD COLUMN IF NOT EXISTS notes text;

-- 2. Create Person Photos Table
CREATE TABLE IF NOT EXISTS person_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  description text,
  is_profile_picture boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- 3. Create Life Events Table
CREATE TABLE IF NOT EXISTS life_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- 'birth', 'death', 'marriage', 'career', 'other'
  date date,
  title text NOT NULL,
  description text,
  location text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE person_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for person_photos
CREATE POLICY "Users can view their own person photos" ON person_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own person photos" ON person_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own person photos" ON person_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own person photos" ON person_photos
  FOR DELETE USING (auth.uid() = user_id);

-- 6. RLS Policies for life_events
CREATE POLICY "Users can view their own life events" ON life_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own life events" ON life_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life events" ON life_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life events" ON life_events
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Storage Bucket (This usually needs to be done in Supabase UI, but SQL can create objects if bucket exists)
-- We will assume the 'photos' bucket needs to be created in the dashboard or via API.
-- Policy for storage objects would be needed too.
