
-- Add passing_threshold and result columns to evaluations table
ALTER TABLE evaluations ADD COLUMN passing_threshold NUMERIC(5, 2) DEFAULT 3.50;
ALTER TABLE evaluations ADD COLUMN result TEXT;

-- Populate existing evaluations based on 3.5 threshold
UPDATE evaluations SET passing_threshold = 3.50;
UPDATE evaluations SET result = CASE WHEN overall_score >= 3.50 THEN 'pass' ELSE 'fail' END;
