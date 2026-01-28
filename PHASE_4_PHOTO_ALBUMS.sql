-- Add life_event_id to person_photos table
ALTER TABLE person_photos 
ADD COLUMN life_event_id UUID REFERENCES life_events(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX idx_person_photos_life_event_id ON person_photos(life_event_id);
