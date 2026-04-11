-- 1. JobStageConfig: Add CASCADE to job_id
ALTER TABLE job_stage_configs DROP CONSTRAINT IF EXISTS job_stage_configs_job_id_fkey;
ALTER TABLE job_stage_configs ADD CONSTRAINT job_stage_configs_job_id_fkey 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- 2. job_skills: Add CASCADE to both IDs
ALTER TABLE job_skills DROP CONSTRAINT IF EXISTS job_skills_job_id_fkey;
ALTER TABLE job_skills ADD CONSTRAINT job_skills_job_id_fkey 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE job_skills DROP CONSTRAINT IF EXISTS job_skills_skill_id_fkey;
ALTER TABLE job_skills ADD CONSTRAINT job_skills_skill_id_fkey 
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;

-- 3. Jobs: created_by -> SET NULL and Nullable
ALTER TABLE jobs ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_created_by_fkey;
ALTER TABLE jobs ADD CONSTRAINT jobs_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Files: owner_id -> SET NULL and Nullable
ALTER TABLE files ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_owner_id_fkey;
ALTER TABLE files ADD CONSTRAINT files_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- 5. Users: role_id -> SET NULL and Nullable
ALTER TABLE users ALTER COLUMN role_id DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
