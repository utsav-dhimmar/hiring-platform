-- Migration: Add 'notes' field to hr_decisions table
-- Description: Add optional notes field for HR decision comments
-- Created: 2026-04-02

-- Add the notes column to hr_decisions table
ALTER TABLE hr_decisions 
ADD COLUMN notes TEXT;

-- Add comment to describe the new column
COMMENT ON COLUMN hr_decisions.notes IS 'Optional notes/comments for HR decisions. Required for May Be decisions.';

-- Update existing records to have NULL notes (they will be optional)
-- This is handled automatically by ADD COLUMN with nullable TEXT

-- Create index for better query performance on decision filtering
CREATE INDEX IF NOT EXISTS idx_hr_decisions_candidate_decision 
ON hr_decisions(candidate_id, decision);

-- Create index for decision history queries
CREATE INDEX IF NOT EXISTS idx_hr_decisions_decided_at 
ON hr_decisions(decided_at DESC);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Added notes field to hr_decisions table';
END $$;
