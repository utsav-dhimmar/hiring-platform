
-- Migration to add case-insensitive unique constraints to skills and ensure departments are covered

-- 1. Skills - Name should be case-insensitively unique
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_skills_name_lower') THEN
        CREATE UNIQUE INDEX uq_skills_name_lower ON skills (LOWER(name));
    END IF;
END $$;

-- 2. Departments - Ensure case-insensitive unique index exists (repeat for safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_departments_name_lower') THEN
        CREATE UNIQUE INDEX uq_departments_name_lower ON departments (LOWER(name));
    END IF;
END $$;
