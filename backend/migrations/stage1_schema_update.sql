-- Create criteria table
CREATE TABLE IF NOT EXISTS criteria (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    prompt_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    transcript_id UUID REFERENCES transcripts(id) ON DELETE SET NULL,
    candidate_stage_id UUID NOT NULL REFERENCES candidate_stages(id) ON DELETE CASCADE,
    evaluation_data JSONB NOT NULL,
    overall_score NUMERIC(5, 2),
    recommendation TEXT,
    sim_jd_resume NUMERIC(5, 4),
    sim_jd_transcript NUMERIC(5, 4),
    sim_resume_transcript NUMERIC(5, 4),
    evidence_block JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create stage_template_criteria table
CREATE TABLE IF NOT EXISTS stage_template_criteria (
    id UUID PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES stage_templates(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    default_weight NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create transcript_chunks table
CREATE TABLE IF NOT EXISTS transcript_chunks (
    id UUID PRIMARY KEY,
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    text_content TEXT NOT NULL,
    embedding JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update transcripts table
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS transcript_hash TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS clean_transcript_text TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS transcript_embeddings JSONB;

-- Add index and unique constraint to transcript_hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_transcripts_transcript_hash ON transcripts(transcript_hash);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_stage_id ON evaluations(candidate_stage_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_transcript_id ON transcript_chunks(transcript_id);
CREATE INDEX IF NOT EXISTS idx_stage_template_criteria_template_id ON stage_template_criteria(template_id);
CREATE INDEX IF NOT EXISTS idx_stage_template_criteria_criterion_id ON stage_template_criteria(criterion_id);
