
ALTER TABLE persons 
ADD COLUMN is_deceased boolean DEFAULT false,
ADD COLUMN date_of_death date,
ADD COLUMN is_visible_in_share boolean DEFAULT true,
ADD COLUMN confidence_level text DEFAULT 'confirmed',
ADD COLUMN source_url text,
ADD COLUMN source_notes text;

ALTER TABLE life_events
ADD COLUMN confidence_level text DEFAULT 'confirmed',
ADD COLUMN source_url text,
ADD COLUMN source_notes text;

ALTER TABLE relationships
ADD COLUMN IF NOT EXISTS source_handle text,
ADD COLUMN IF NOT EXISTS target_handle text;
