-- Create candidate_stages table
CREATE TABLE IF NOT EXISTS candidate_stages (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_stage_id UUID NOT NULL REFERENCES job_stage_configs(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    evaluation_data JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_candidate_stages_candidate_id ON candidate_stages(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stages_job_stage_id ON candidate_stages(job_stage_id);
