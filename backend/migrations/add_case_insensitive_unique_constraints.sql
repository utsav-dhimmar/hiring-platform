
-- Migration to add case-insensitive unique constraints to roles, jobs, and departments

-- 1. Jobs - Title should be case-insensitively unique
-- First check if a case-sensitive index exists (it shouldn't based on my inspection, but good to be safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_jobs_title_lower') THEN
        CREATE UNIQUE INDEX uq_jobs_title_lower ON jobs (LOWER(title));
    END IF;
END $$;

-- 2. Roles - Name should be case-insensitively unique
-- We already have roles_name_key, but we want it to be case-insensitive
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_roles_name_lower') THEN
        CREATE UNIQUE INDEX uq_roles_name_lower ON roles (LOWER(name));
    END IF;
END $$;

-- 3. Departments - Name should be case-insensitively unique
-- We already have departments_name_key, but we want it to be case-insensitive
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_departments_name_lower') THEN
        CREATE UNIQUE INDEX uq_departments_name_lower ON departments (LOWER(name));
    END IF;
END $$;
