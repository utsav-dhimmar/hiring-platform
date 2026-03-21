// separate role table
// so admin can introduce new role
Table roles {
  id uuid [primary key] // unique id for the role
  name text [not null, unique] // name of the role like HR, intern etc
  created_at timestamp
  updated_at timestamp
}

// permissions for specific role
Table permissions {
  id uuid [primary key] // unique id for the permissions
  name text [not null, unique] // name of the permission
  description text [not null] // few words on the description
  created_at timestamp
  updated_at timestamp
}

// Role and Permission table
Table roleAndPermission {
  permission_id uuid [ref: > permissions.id]
  role_id uuid [ref: > roles.id]
}

// user table
Table users {
  id uuid [primary key] // id
  full_name varchar
  email varchar [not null, unique]
  password_hash varchar [not null]
  is_active boolean [default: true] // for soft delete
  role_id UUID [ref: > roles.id] // user for which role
  created_at timestamp
  updated_at timestamp
}

Table jobs {
  id UUID [primary key]
  title TEXT [not null] // title of the job
  department TEXT
  jd_text TEXT
  jd_json JSONB
  created_by UUID [ref: > users.id] // who created this job
  created_at timestamp
  is_active BOOLEAN [default: TRUE]
}

Table skills {
  id uuid [pk] // id
  name text [not null, unique] // Unique name of the skill
  description text // Few words on this skill
  created_at timestamp
}

Table job_skills {
  // A single job require multiple skill and
  // one skill can appear in multiple jobs
  job_id uuid [ref: > jobs.id]
  skill_id uuid [ref: > skills.id]
}

Table candidate_skills {
  // which candidate has which skill
  candidate_id uuid [ref: > candidates.id]
  skill_id uuid [ref: > skills.id]
}

Table candidates {
  id uuid [pk]
  // INPUTTED BY HR
  first_name text
  last_name text
  email text
  phone text
  // ------------
  applied_job_id uuid [ref: > jobs.id]
  info JSONB
  rrf_score NUMERIC(5, 4)
  current_status text
  created_at timestamp
}

// default is 3 and for senior role cto interview
Table stage_templates {
  id uuid [pk] // unique id
  name text [not null] // name for stage like HR Screening Round, Technical Practical Round, etc.
  description text // some info regarding stages
  default_config jsonb
  created_at timestamp
}

Table job_stage_configs {
  id uuid [pk]
  job_id uuid [ref: > jobs.id] // stage for which job
  stage_order int [not null] // define job stage sequence
  template_id uuid [ref: > stage_templates.id]
  // which stage template to be apply
  config jsonb // JSON for allow flexible input
  is_mandatory boolean [default: true]
  created_at timestamp
}

// resume / cover letter / transcribe file
Table files {
  id uuid [pk]
  owner_id uuid [ref: > users.id] // who uploaded
  candidate_id uuid [ref: > candidates.id] // for which candidate
  file_name text // original file name
  file_type text // type (pdf, docx, json, etc)
  source_url text // IF EXTERNAL LINK
  size int // size of the file
  content_hash text [index] // SHA-256 for duplicate detection
  created_at timestamp
}

Table resumes {
  id uuid [pk]
  candidate_id uuid [ref: > candidates.id]
  file_id uuid [ref: > files.id]
  uploaded_at timestamp [default: `now()`]
  parsed boolean [default: false]
  parse_summary jsonb
  resume_score numeric
  pass_fail boolean
  pass_threshold numeric [default: 0.65]
  text_hash text [index] // SHA-256 for content deduplication
}

Table cover_letters {
  id uuid [pk]
  candidate_id uuid [ref: > candidates.id]
  file_id uuid [ref: > files.id]
  resume_id uuid [ref: > resumes.id] // OPTIONAL: Companion resume
  extracted_text text
  uploaded_at timestamp [default: `now()`]
}

Table resume_chunks {
  id uuid [pk]
  resume_id uuid [ref: > resumes.id]
  parsed_at timestamp
  parsed_json jsonb
  raw_text text
}

Table hr_decisions {
  id uuid [pk]
  candidate_id uuid [ref: > candidates.id]
  stage_config_id uuid [ref: > job_stage_configs.id]
  user uuid [ref: > users.id]
  decision text [not null] // 'proceed', 'reject', 'hold'
  decided_at timestamp [default: `now()`]
}

Table interviews {
  id uuid [pk]
  candidate_id uuid [ref: > candidates.id]
  job_id uuid [ref: > jobs.id]
  interviewer_id uuid [ref: > users.id]
  status text [default: 'pending']
  created_at timestamp
}

// NOT USED: HR uploads transcribe files directly as Transcripts
Table recordings {
  id uuid [pk]
  interview_id uuid [ref: > interviews.id]
  file_id uuid [ref: > files.id]
  format text // mp3 , wav, mp4
  duration_seconds int
  uploaded_at timestamp [default: `now()`]
  processing_status text [default: 'uploaded']
}

Table transcripts {
  id uuid [pk]
  interview_id uuid [ref: > interviews.id] // Directly linked to Interview
  file_id uuid [ref: > files.id] // Points to the uploaded transcribe file
  transcript_text text
  segments jsonb // {START: 0.0, SP1: "...", SP2: "...", END: 1.1}
  generated_at timestamp [default: `now()`]
}

Table audit_logs {
  id UUID [primary key]
  user_id UUID [ref: > users.id]
  action TEXT [not null]
  target_type TEXT
  target_id UUID
  details JSONB
  created_at timestamp
}
