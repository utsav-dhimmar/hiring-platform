-- Migration: Add location column to candidates
-- Description: Persist normalized candidate location extracted from resume parsing
-- Created: 2026-04-09

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN candidates.location IS 'Normalized location extracted from candidate resume parsing.';

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Added location column to candidates';
END $$;
