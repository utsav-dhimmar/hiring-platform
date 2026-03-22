# Data Architecture

## Overview

The Hiring Platform uses PostgreSQL as its primary relational database with pgvector extension for vector similarity search. The data architecture is designed to support the complete hiring workflow from candidate application through final hiring decision.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA ARCHITECTURE LAYERS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        PRESENTATION LAYER                              │   │
│  │                                                                      │   │
│  │   React Frontend ◄──────► REST API ◄──────► Pydantic Schemas        │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        APPLICATION LAYER                             │   │
│  │                                                                      │   │
│  │   Services ◄──────────► Repositories ◄──────────► ORM (SQLAlchemy)   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA LAYER                                   │   │
│  │                                                                      │   │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │   │   PostgreSQL    │  │    pgvector     │  │     Redis       │   │   │
│  │   │   Relational   │  │    Vector       │  │     Cache       │   │   │
│  │   │    Storage      │  │    Storage      │  │                 │   │   │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram (DFD)

### Level 0: Context Diagram

```mermaid
flowchart LR
    subgraph External["External Entities"]
        HR[HR User]
        ADMIN[Admin User]
        SYS[External Systems]
    end

    subgraph System["Hiring Platform System"]
        API[API Gateway]
        AUTH[Auth Module]
        JOB_MGMT[Job Management]
        CAND_MGMT[Candidate Management]
        RESUME_PROC[Resume Processing]
        STAGE_PROC[Interview Stage Processing]
        ADMIN_MGMT[Admin Management]
        AI_ENGINE[AI Engine]
        ANALYTICS[Analytics Engine]
    end

    HR <--> API
    ADMIN <--> API
    SYS <--> API

    API <--> AUTH
    API <--> JOB_MGMT
    API <--> CAND_MGMT
    API <--> RESUME_PROC
    API <--> STAGE_PROC
    API <--> ADMIN_MGMT

    RESUME_PROC <--> AI_ENGINE
    STAGE_PROC <--> AI_ENGINE
    ANALYTICS <--> JOB_MGMT
    ANALYTICS <--> CAND_MGMT
```

### Level 1: Main Processes

```mermaid
flowchart TB
    subgraph Auth_Flow["1. Authentication & Authorization"]
        AUTH_IN[Login Request] --> AUTH_V[Validate Credentials]
        AUTH_V --> AUTH_T[Generate JWT Token]
        AUTH_T --> AUTH_R[Return Token]
    end

    subgraph Job_Flow["2. Job Management"]
        JOB_IN[Create/Update Job] --> JOB_V[Validate Job Data]
        JOB_V --> JOB_S[Save Job to DB]
        JOB_S --> JOB_SK[Link Job Skills]
        JOB_SK --> JOB_ST[Configure Stages]
        JOB_ST --> JOB_OUT[Return Job Response]
    end

    subgraph Resume_Flow["3. Resume Processing"]
        RES_IN[Upload Resume] --> RES_V[Validate File]
        RES_V --> RES_P[Parse Document]
        RES_P --> RES_E[Extract Info (LLM)]
        RES_E --> RES_EM[Generate Embeddings]
        RES_EM --> RES_M[Match with Job]
        RES_M --> RES_S[Store Results]
        RES_S --> RES_OUT[Return Match Score]
    end

    subgraph Candidate_Flow["4. Candidate Management"]
        CAND_IN[Candidate Action] --> CAND_S[Update Candidate Status]
        CAND_S --> CAND_INT[Create Interview]
        CAND_INT --> CAND_DEC[Record HR Decision]
        CAND_DEC --> CAND_OUT[Return Response]
    end

    subgraph Stage_Flow["5. Interview Stage Processing"]
        STAGE_IN[Stage Recording] --> STAGE_UP[Upload Recording]
        STAGE_UP --> STAGE_TR[Generate Transcript]
        STAGE_TR --> STAGE_EV[AI Evaluation]
        STAGE_EV --> STAGE_SC[Store Scores]
        STAGE_SC --> STAGE_OUT[Return Evaluation]
    end

    subgraph Admin_Flow["6. Admin Operations"]
        ADMIN_IN[Admin Request] --> ADMIN_V[Check Permissions]
        ADMIN_V --> ADMIN_OP[Execute Operation]
        ADMIN_OP --> ADMIN_LOG[Log to Audit]
        ADMIN_LOG --> ADMIN_OUT[Return Response]
    end

    subgraph Analytics_Flow["7. Analytics"]
        DATA_IN[System Data] --> AGG[Aggregate Metrics]
        AGG --> REPORT[Generate Reports]
        REPORT --> ANAL_OUT[Return Analytics]
    end
```

### Level 2: Resume Processing Detail

```mermaid
flowchart TB
    subgraph Upload["Resume Upload Process"]
        U1[Receive File] --> U2[Validate Type/Size]
        U2 --> U3[Save to Storage]
        U3 --> U4[Create File Record]
        U4 --> U5[Create Candidate Record]
        U5 --> U6[Create Resume Record]
        U6 --> U7[Queue for Processing]
    end

    subgraph Processing["Background Processing"]
        P1[Fetch Pending Resume] --> P2[Extract Text]
        P2 --> P3[LLM Structured Extraction]
        P3 --> P4[Normalize Data]
        P4 --> P5[Generate Candidate Embedding]
        P5 --> P6[Fetch Job Embedding]
        P6 --> P7[Calculate Similarity]
        P7 --> P8[LLM Job Match Analysis]
        P8 --> P9[Calculate RRF Score]
        P9 --> P10[Store Analysis Results]
    end

    subgraph Caching["Embedding Cache"]
        C1[Check Job Embedding Cache] -->|Hit| C2[Return Cached]
        C1 -->|Miss| C3[Generate Job Embedding]
        C3 --> C4[Store in Cache]
        C4 --> C2
    end

    U7 --> P1
    P6 --> C1
```

### Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW SUMMARY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  External Entities                    Process                                │
│  ───────────────                    ────────                                │
│                                                                              │
│  HR User ───────────┬───► Authentication ───────► JWT Token                 │
│                    │                                                         │
│  HR User ──────────┼───► Job Management ────────► Job Record                │
│                    │        │                                                 │
│                    │        ▼                                                 │
│                    └───► Resume Upload ────────► Candidate + Resume          │
│                         │       │                                          │
│                         │       ▼                                          │
│                         └───► AI Processing ───► Match Score + Analysis     │
│                                   │                                          │
│                                   ▼                                          │
│  Admin User ────────┼───► Stage Processing ────► Interview Evaluation         │
│                    │        │                                                 │
│                    │        ▼                                                 │
│                    └───► Admin Operations ──► Audit Log Entry               │
│                                                                              │
│  Data Stores                                                            │
│  ───────────                                                            │
│                                                                              │
│  Users ────► Stores user accounts and authentication data                  │
│  Jobs ─────► Stores job postings and requirements                          │
│  Candidates ──► Stores candidate information and status                    │
│  Resumes ────► Stores resume files and extracted data                     │
│  Skills ─────► Stores skill definitions and embeddings                     │
│  Stages ─────► Stores interview stage configurations                       │
│  Interviews ──► Stores interview records and evaluations                    │
│  Audit ──────► Stores all administrative action logs                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Relationship (ER) Diagram

### Complete ER Diagram

```mermaid
erDiagram
    users ||--o{ roles : "assigned_to"
    users ||--o{ audit_logs : "creates"
    users ||--o{ jobs : "creates"
    users ||--o{ files : "uploads"
    users ||--o{ interviews : "interviews"
    users ||--o{ hr_decisions : "decides"

    roles ||--o{ roleAndPermission : "has"
    permissions ||--o{ roleAndPermission : "granted_to"

    jobs ||--o{ candidates : "attracts"
    jobs ||--o{ job_skills : "requires"
    jobs ||--o{ job_stage_configs : "defines"
    jobs ||--o{ interviews : "involves"

    skills ||--o{ job_skills : "required_by"
    skills ||--o{ candidate_skills : "possessed_by"

    candidates ||--o{ candidate_skills : "has"
    candidates ||--o{ resumes : "submits"
    candidates ||--o{ files : "uploads"
    candidates ||--o{ interviews : "participates"
    candidates ||--o{ hr_decisions : "receives"
    candidates ||--o{ cover_letters : "writes"

    stage_templates ||--o{ job_stage_configs : "applied_to"

    files ||--o{ resumes : "referenced_by"
    files ||--o{ cover_letters : "uploaded_as"
    files ||--o{ transcripts : "source_of"

    resumes ||--o{ resume_chunks : "split_into"
    resumes ||--o{ cover_letters : "companion_to"

    interviews ||--o{ recordings : "recorded_as"
    interviews ||--o{ transcripts : "transcribed_to"

    job_stage_configs ||--o{ hr_decisions : "evaluated_at"
```

### Core Entity Schemas

#### User Management Entities

```mermaid
erDiagram
    users {
        uuid id PK
        string full_name
        string email UK
        string password_hash
        boolean is_active
        uuid role_id FK
        timestamp created_at
        timestamp updated_at
    }

    roles {
        uuid id PK
        string name UK
        string description
        timestamp created_at
        timestamp updated_at
    }

    permissions {
        uuid id PK
        string name UK
        string description
        timestamp created_at
    }

    roleAndPermission {
        uuid permission_id FK
        uuid role_id FK
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string target_type
        uuid target_id
        jsonb details
        timestamp created_at
    }

    users ||--o{ roles : "has_role"
    roles ||--o{ permissions : "grants"
    audit_logs }o--|| users : "created_by"
```

#### Job & Skill Entities

```mermaid
erDiagram
    jobs {
        uuid id PK
        string title
        string department
        text jd_text
        jsonb jd_json
        uuid created_by FK
        boolean is_active
        timestamp created_at
    }

    skills {
        uuid id PK
        string name UK
        string description
        vector skill_embedding
        timestamp created_at
    }

    job_skills {
        uuid job_id FK
        uuid skill_id FK
    }

    job_stage_configs {
        uuid id PK
        uuid job_id FK
        int stage_order
        uuid template_id FK
        jsonb config
        boolean is_mandatory
        timestamp created_at
    }

    stage_templates {
        uuid id PK
        string name
        string description
        jsonb default_config
        timestamp created_at
    }

    jobs ||--o{ job_skills : "requires"
    skills ||--o{ job_skills : "requested"
    jobs ||--o{ job_stage_configs : "defines"
    stage_templates ||--o{ job_stage_configs : "applied"
```

#### Candidate Entities

```mermaid
erDiagram
    candidates {
        uuid id PK
        string first_name
        string last_name
        string email
        string phone
        uuid applied_job_id FK
        jsonb info
        vector info_embedding
        numeric rrf_score
        string current_status
        timestamp created_at
    }

    candidate_skills {
        uuid candidate_id FK
        uuid skill_id FK
    }

    resumes {
        uuid id PK
        uuid candidate_id FK
        uuid file_id FK
        timestamp uploaded_at
        boolean parsed
        jsonb parse_summary
        numeric resume_score
        boolean pass_fail
        numeric pass_threshold
        string text_hash
    }

    resume_chunks {
        uuid id PK
        uuid resume_id FK
        timestamp parsed_at
        jsonb parsed_json
        text raw_text
    }

    cover_letters {
        uuid id PK
        uuid candidate_id FK
        uuid file_id FK
        uuid resume_id FK
        text extracted_text
        timestamp uploaded_at
    }

    files {
        uuid id PK
        uuid owner_id FK
        uuid candidate_id FK
        string file_name
        string file_type
        string source_url
        int size
        string content_hash
        timestamp created_at
    }

    candidates ||--o{ candidate_skills : "possesses"
    candidates ||--o{ resumes : "submits"
    candidates ||--o{ cover_letters : "writes"
    candidates }o--|| jobs : "applies_to"
    resumes }o--|| files : "stored_as"
    cover_letters }o--|| files : "stored_as"
```

#### Interview Entities

```mermaid
erDiagram
    interviews {
        uuid id PK
        uuid candidate_id FK
        uuid job_id FK
        uuid interviewer_id FK
        string status
        timestamp created_at
    }

    recordings {
        uuid id PK
        uuid interview_id FK
        uuid file_id FK
        string format
        int duration_seconds
        timestamp uploaded_at
        string processing_status
    }

    transcripts {
        uuid id PK
        uuid interview_id FK
        uuid file_id FK
        text transcript_text
        jsonb segments
        timestamp generated_at
    }

    hr_decisions {
        uuid id PK
        uuid candidate_id FK
        uuid stage_config_id FK
        uuid user FK
        string decision
        timestamp decided_at
    }

    interviews ||--o{ recordings : "has"
    interviews ||--o{ transcripts : "has"
    recordings }o--|| files : "stored_as"
    transcripts }o--|| files : "derived_from"
    hr_decisions }o--|| candidates : "for"
    hr_decisions }o--|| job_stage_configs : "at_stage"
```

---

## Database Schema Details

### Primary Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `users` | Platform users | id, email, password_hash, role_id |
| `roles` | User roles | id, name |
| `permissions` | System permissions | id, name, description |
| `roleAndPermission` | Role-permission mapping | role_id, permission_id |
| `jobs` | Job postings | id, title, jd_text, jd_json, created_by |
| `skills` | Skill definitions | id, name, skill_embedding |
| `job_skills` | Job-skill associations | job_id, skill_id |
| `candidates` | Job applicants | id, applied_job_id, info, info_embedding, rrf_score |
| `candidate_skills` | Candidate-skill associations | candidate_id, skill_id |
| `files` | Uploaded files | id, owner_id, candidate_id, file_name, content_hash |
| `resumes` | Resume records | id, candidate_id, file_id, parse_summary, resume_score |
| `cover_letters` | Cover letter records | id, candidate_id, file_id |
| `resume_chunks` | Parsed resume segments | id, resume_id, parsed_json, raw_text |
| `stage_templates` | Interview stage templates | id, name, default_config |
| `job_stage_configs` | Job stage configurations | id, job_id, template_id, stage_order |
| `interviews` | Interview records | id, candidate_id, job_id, interviewer_id, status |
| `recordings` | Interview recordings | id, interview_id, file_id, format |
| `transcripts` | Interview transcripts | id, interview_id, transcript_text, segments |
| `hr_decisions` | HR stage decisions | id, candidate_id, stage_config_id, decision |
| `audit_logs` | Action audit trail | id, user_id, action, target_type, details |

### Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `users` | email | UNIQUE | Fast email lookup |
| `files` | content_hash | INDEX | Duplicate detection |
| `resumes` | text_hash | INDEX | Deduplication |
| `candidates` | applied_job_id | INDEX | Job candidate filtering |
| `jobs` | is_active | INDEX | Active job queries |
| `candidates` | rrf_score | INDEX | Ranking queries |
| `audit_logs` | user_id, created_at | COMPOSITE | User activity queries |
| `candidates` | info_embedding | VECTOR | Semantic similarity search |

### Vector Storage (pgvector)

The platform uses pgvector for semantic search capabilities:

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Example: Candidate embeddings for semantic search
ALTER TABLE candidates 
ADD COLUMN info_embedding vector(384);

-- Example: Skill embeddings
ALTER TABLE skills 
ADD COLUMN skill_embedding vector(384);

-- Semantic similarity query
SELECT id, name, 
       1 - (info_embedding <=> $query_embedding) AS similarity
FROM candidates
ORDER BY info_embedding <=> $query_embedding
LIMIT 10;
```

---

## Data Relationships

### Primary Key Strategy

- **UUID7**: All primary keys use UUID7 for time-ordered uniqueness
- **Benefits**: Distributed ID generation, time-sortable, collision-free

### Foreign Key Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FOREIGN KEY RELATIONSHIPS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  users ──────────────┬──► roles (many-to-one)                               │
│                      │                                                       │
│  users ─────────────┼──► audit_logs (one-to-many)                           │
│                      │                                                       │
│  jobs ───────────────┼──► users (many-to-one, created_by)                  │
│                      │                                                       │
│  jobs ───────────────┼──► candidates (one-to-many)                          │
│                      │                                                       │
│  jobs ───────────────┼──► job_skills (one-to-many)                         │
│                      │                                                       │
│  jobs ───────────────┼──► job_stage_configs (one-to-many)                   │
│                      │                                                       │
│  skills ─────────────┼──► job_skills (one-to-many)                         │
│                      │                                                       │
│  skills ─────────────┼──► candidate_skills (one-to-many)                  │
│                      │                                                       │
│  candidates ──────────┼──► jobs (many-to-one, applied_job_id)              │
│                      │                                                       │
│  candidates ──────────┼──► resumes (one-to-many)                            │
│                      │                                                       │
│  candidates ──────────┼──► files (one-to-many)                             │
│                      │                                                       │
│  candidates ──────────┼──► interviews (one-to-many)                         │
│                      │                                                       │
│  candidates ──────────┼──► hr_decisions (one-to-many)                      │
│                      │                                                       │
│  stage_templates ─────┼──► job_stage_configs (one-to-many)                  │
│                      │                                                       │
│  job_stage_configs ───┼──► hr_decisions (one-to-many)                      │
│                      │                                                       │
│  files ───────────────┼──► resumes (one-to-one)                            │
│                      │                                                       │
│  interviews ──────────┼──► recordings (one-to-many)                        │
│                      │                                                       │
│  interviews ──────────┼──► transcripts (one-to-many)                       │
│                      │                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cascade Rules

| Parent Table | Child Table | On Delete |
|--------------|-------------|-----------|
| users | audit_logs | CASCADE |
| users | jobs | CASCADE |
| users | files | CASCADE |
| users | interviews | CASCADE |
| jobs | candidates | CASCADE |
| jobs | job_skills | CASCADE |
| jobs | job_stage_configs | CASCADE |
| jobs | interviews | CASCADE |
| skills | job_skills | CASCADE |
| skills | candidate_skills | CASCADE |
| candidates | candidate_skills | CASCADE |
| candidates | resumes | CASCADE |
| candidates | files | CASCADE |
| candidates | interviews | CASCADE |
| candidates | hr_decisions | CASCADE |
| candidates | cover_letters | CASCADE |
| files | resumes | SET NULL |
| files | cover_letters | SET NULL |
| files | transcripts | SET NULL |
| resumes | resume_chunks | CASCADE |
| resumes | cover_letters | SET NULL |
| interviews | recordings | CASCADE |
| interviews | transcripts | CASCADE |
| stage_templates | job_stage_configs | RESTRICT |
| job_stage_configs | hr_decisions | RESTRICT |
| roles | users | RESTRICT |

---

## Data Storage Architecture

### Storage Tiers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STORAGE TIERS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        HOT STORAGE (Redis)                            │   │
│  │                                                                      │   │
│  │  • Session data                                                      │   │
│  │  • Job embeddings cache                                              │   │
│  │  • Processing queue status                                           │   │
│  │  • Temporary tokens                                                   │   │
│  │                                                                      │   │
│  │  TTL: 1 hour - 24 hours                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       WARM STORAGE (PostgreSQL)                      │   │
│  │                                                                      │   │
│  │  • User accounts                                                      │   │
│  │  • Jobs and candidates                                                │   │
│  │  • Interview records                                                 │   │
│  │  • Audit logs                                                         │   │
│  │                                                                      │   │
│  │  Retention: Indefinite                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       COLD STORAGE (File System)                     │   │
│  │                                                                      │   │
│  │  • Resume files (PDF/DOCX)                                           │   │
│  │  • Cover letters                                                     │   │
│  │  • Interview recordings                                              │   │
│  │  • Transcripts                                                       │   │
│  │                                                                      │   │
│  │  Retention: Job duration + 1 year                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Storage Structure

```
uploads/
├── resumes/
│   ├── {year}/
│   │   ├── {month}/
│   │   │   ├── {uuid}.pdf
│   │   │   └── {uuid}.docx
├── cover_letters/
│   ├── {year}/
│   │   ├── {month}/
│   │   │   └── {uuid}.pdf
├── recordings/
│   ├── {interview_id}/
│   │   ├── {uuid}.mp3
│   │   └── {uuid}.mp4
└── transcripts/
    └── {interview_id}/
        └── {uuid}.json
```

---

## Data Access Patterns

### Common Queries

#### Find Candidates by Job with Ranking

```sql
SELECT c.*, 
       r.resume_score,
       c.rrf_score,
       c.current_status
FROM candidates c
LEFT JOIN resumes r ON r.candidate_id = c.id
WHERE c.applied_job_id = $job_id
ORDER BY c.rrf_score DESC, c.created_at DESC
LIMIT 50;
```

#### Semantic Candidate Search

```sql
SELECT c.id, c.first_name, c.last_name,
       1 - (c.info_embedding <=> $query_embedding) AS similarity
FROM candidates c
WHERE c.applied_job_id = $job_id
  AND c.current_status = 'active'
ORDER BY c.info_embedding <=> $query_embedding
LIMIT 20;
```

#### Job Pipeline Analytics

```sql
SELECT 
    j.title,
    COUNT(c.id) AS total_candidates,
    COUNT(CASE WHEN r.pass_fail = true THEN 1 END) AS passed_screening,
    COUNT(CASE WHEN c.current_status = 'hired' THEN 1 END) AS hired
FROM jobs j
LEFT JOIN candidates c ON c.applied_job_id = j.id
LEFT JOIN resumes r ON r.candidate_id = c.id
WHERE j.id = $job_id
GROUP BY j.id, j.title;
```

#### Interview Stage Progress

```sql
SELECT 
    s.name AS stage_name,
    COUNT(DISTINCT hd.candidate_id) AS decided,
    jsc.is_mandatory
FROM job_stage_configs jsc
JOIN stage_templates s ON s.id = jsc.template_id
LEFT JOIN hr_decisions hd ON hd.stage_config_id = jsc.id
WHERE jsc.job_id = $job_id
GROUP BY s.name, jsc.stage_order, jsc.is_mandatory
ORDER BY jsc.stage_order;
```

---

## Data Security

### Sensitive Data Handling

| Data Type | Storage | Encryption | Access Control |
|-----------|---------|------------|----------------|
| Passwords | BCrypt hash | At rest | System only |
| JWT Secrets | Environment | At rest | Backend only |
| PII (name, email) | PostgreSQL | Optional | RBAC |
| Resume Files | File system | Optional | RBAC |
| Interview Recordings | File system | Optional | Admin only |
| Audit Logs | PostgreSQL | At rest | Admin only |

### Data Validation

- **Input**: Pydantic V2 schemas validate all API inputs
- **Types**: UUID validation for all foreign keys
- **Constraints**: Database-level constraints for referential integrity
- **File Validation**: MIME type and size validation before storage
