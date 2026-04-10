-- Migration: Create locations table and normalize candidate locations
-- Description: Extracts location data from candidates into a dedicated locations table
--              and replaces the text column with a foreign key reference.
-- Created: 2026-04-10

-- 1. Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id   UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

COMMENT ON TABLE  locations      IS 'Normalized location lookup table (city/region).';
COMMENT ON COLUMN locations.name IS 'Unique, title-cased location name (e.g. Mumbai, Delhi).';

-- 2. Populate locations from existing distinct candidate locations
INSERT INTO locations (id, name)
SELECT gen_random_uuid(), INITCAP(TRIM(location))
FROM (
    SELECT DISTINCT LOWER(TRIM(location)) AS location
    FROM   candidates
    WHERE  location IS NOT NULL
      AND  TRIM(location) <> ''
      AND  LOWER(TRIM(location)) NOT IN ('not mentioned', 'null', 'none')
) sub
ON CONFLICT (name) DO NOTHING;

-- 3. Add location_id FK column to candidates
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- 4. Backfill location_id from existing location text
UPDATE candidates c
SET    location_id = l.id
FROM   locations l
WHERE  INITCAP(TRIM(c.location)) = l.name
  AND  c.location IS NOT NULL
  AND  TRIM(c.location) <> '';

-- 5. Drop old location text column
ALTER TABLE candidates
DROP COLUMN IF EXISTS location;

-- 6. Create index on location_id for faster joins
CREATE INDEX IF NOT EXISTS idx_candidates_location_id ON candidates(location_id);

DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Created locations table and normalized candidate locations';
END $$;
