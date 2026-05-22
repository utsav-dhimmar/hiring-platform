-- Fix candidate_skills foreign key constraints to support cascade deletion
ALTER TABLE candidate_skills DROP CONSTRAINT IF EXISTS candidate_skills_candidate_id_fkey;
ALTER TABLE candidate_skills ADD CONSTRAINT candidate_skills_candidate_id_fkey 
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;

ALTER TABLE candidate_skills DROP CONSTRAINT IF EXISTS candidate_skills_skill_id_fkey;
ALTER TABLE candidate_skills ADD CONSTRAINT candidate_skills_skill_id_fkey 
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
