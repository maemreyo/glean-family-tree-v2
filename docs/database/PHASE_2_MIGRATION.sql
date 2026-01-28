-- =====================================================
-- PHASE 2: STABILITY & DATA INTEGRITY MIGRATION
-- =====================================================

-- 2.1 Persist Node Positions
-- Add position columns to persons table
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS position_x numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_y numeric DEFAULT 0;

-- 2.2 Complex Relationships
-- Add type column to relationships table if it doesn't exist
-- Note: Current implementation uses parent_id/child_id. 
-- We will migrate to a more flexible structure or add a type column.
-- For now, we'll just add the type column to the existing structure if compatible,
-- or create a new structure if we decide to refactor.
-- Based on roadmap Phase 2.2: Add `type` ('parent', 'spouse') to database.

ALTER TABLE relationships 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'parent' CHECK (type IN ('parent', 'spouse'));

-- Create index for position queries if needed (usually not needed for simple selects)
-- But ensuring we can update efficiently is good.

-- Trigger for updating timestamps is already in place.
