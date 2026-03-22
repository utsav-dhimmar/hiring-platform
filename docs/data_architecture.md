## Data Architecture

The data architecture of the Hiring Platform is built around PostgreSQL utilizing `pgvector` for efficient similarity searches and AI-driven candidate ranking. The schema is normalized to manage users, jobs, candidate profiles, standard resumes, unstructured file uploads, and stage configurations efficiently.

### Data Flow Diagram (DFD)

The following diagram illustrates how data moves through the system from initial job creation to final result visualization.

```mermaid
flowchart TD
    %% External Entities
    HR[HR / Admin]
    
    %% Processes
    P1[Job Creation & Configuration]
    P2[Resume Upload & Parsing]
    P3[AI Embedding Generation]
    P4[Matching & RRF Scoring Engine]
    P5[Interview Media Upload]
    P6[Audio/Video Transcription & Evaluation]
    P7[Dashboard & Analytics Visualization]
    
    %% Data Stores
    DB[(PostgreSQL + pgvector)]
    FS[(File Storage System)]
    
    %% Data Flows
    HR -->|Creates Job & Stages| P1
    P1 -->|Stores JD & Stages| DB
    HR -->|Uploads Resume PDF/DOCX| P2
    P2 -->|Saves Raw File| FS
    P2 -->|Extracts Text| P3
    P3 -->|Generates Embeddings| DB
    DB -->|Fetches JD & Summary Vectors| P4
    P4 -->|Saves Match Score & Rank| DB
    HR -->|Uploads Stage 1/2/3 Media| P5
    P5 -->|Saves MP3/MP4/WAV| FS
    P5 -->|Triggers Pipeline| P6
    P6 -->|Transcribes & Generates Attribute Scores| DB
    DB -->|Aggregates Data| P7
    P7 -->|Displays Rankings & Analytics| HR
```

### Entity Relationship (ER) Diagram

The system's normalized schema includes the following primary entities and their relationships. 

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email
        string password_hash
        uuid role_id FK
        boolean is_active
    }
    
    ROLES {
        uuid id PK
        string name
        string description
    }
    
    JOBS {
        uuid id PK
        string title
        string department
        string jd_text
        vector jd_embedding
        uuid created_by FK
    }

    CANDIDATES {
        uuid id PK
        string first_name
        string last_name
        string email
        uuid applied_job_id FK
        jsonb info
        vector info_embedding
        float rrf_score
        string current_status
    }

    RESUMES {
        uuid id PK
        uuid candidate_id FK
        uuid file_id FK
        vector resume_embedding
        boolean parsed
        jsonb parse_summary
        float resume_score
    }

    INTERVIEWS {
        uuid id PK
        uuid candidate_id FK
        uuid job_id FK
        uuid interviewer_id FK
        string status
        datetime created_at
    }

    FILES {
        uuid id PK
        uuid owner_id FK
        string file_name
        string file_type
        string source_url
    }

    JOB_STAGE_CONFIGS {
        uuid id PK
        uuid job_id FK
        string stage_name
        int stage_order
    }

    ROLES ||--o{ USERS : "assigned to"
    USERS ||--o{ JOBS : "creates"
    USERS ||--o{ INTERVIEWS : "conducts"
    USERS ||--o{ FILES : "owns"
    
    JOBS ||--o{ CANDIDATES : "receives"
    JOBS ||--o{ JOB_STAGE_CONFIGS : "configured with"
    JOBS ||--o{ INTERVIEWS : "pertains to"
    
    CANDIDATES ||--o{ RESUMES : "profiled by"
    CANDIDATES ||--o{ INTERVIEWS : "undergoes"
    CANDIDATES ||--o{ FILES : "uploads"
    
    FILES ||--o| RESUMES : "stored as"
```
