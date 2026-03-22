# Hiring Platform Architecture Documentation

## Overview

The Hiring Platform is a full-stack application for managing the candidate hiring workflow. It combines AI-powered resume screening with a multi-stage interview management system, enabling HR teams to efficiently evaluate, track, and hire candidates.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HIRING PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────────┐          ┌──────────────────────────────┐   │
│   │       FRONTEND        │          │          BACKEND             │   │
│   │   (React + Vite)      │◄────────►│    (FastAPI + SQLAlchemy)    │   │
│   │                       │  REST    │                              │   │
│   │   • Redux Toolkit     │   API    │   • Pydantic V2              │   │
│   │   • React Router v7   │          │   • PostgreSQL + pgvector    │   │
│   │   • React Bootstrap   │          │   • Redis Cache              │   │
│   │   • React Hook Form   │          │   • Ollama LLM Integration   │   │
│   └──────────────────────┘          └──────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 19 (TypeScript) with Vite 8
- **State Management**: Redux Toolkit
- **Routing**: React Router v7
- **UI Components**: React Bootstrap 5.3
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios

### Backend
- **Web Framework**: FastAPI (async Python 3.14+)
- **ORM**: SQLAlchemy + FastCRUD
- **Validation**: Pydantic V2
- **Database**: PostgreSQL with pgvector
- **Caching**: Redis
- **AI/NLP**:
  - DSPy for prompt optimization
  - Sentence Transformers (`all-MiniLM-L6-v2`) for embeddings
  - Ollama for LLM-based analysis
  - pymupdf/docx2txt for document parsing
- **Security**: BCrypt + JWT

---

## Functional Areas

### 1. Authentication & Authorization
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Login Page    │───►│  Auth Service   │───►│  JWT Token      │
│   (Frontend)    │    │  (Backend)      │    │  Generation     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  RBAC System    │
                       │  Roles/Perms    │
                       └─────────────────┘
```

**Key Components**:
- `backend/app/v1/dependencies/auth.py` - JWT authentication
- `backend/app/v1/dependencies/permissions.py` - Permission checking
- `backend/app/v1/db/models/roleAndPermission.py` - Role/Permission models
- `frontend/src/store/slices/authSlice.ts` - Auth state management
- `frontend/src/components/auth/` - Protected/Public/Role routes

### 2. Resume Upload & AI Screening
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  File Upload    │───►│  File Storage   │───►│  Background     │
│  (Frontend)     │    │  (Disk/S3)     │    │  Processing     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                    │
                          ┌─────────────────────────┼─────────────────────────┐
                          ▼                         ▼                         ▼
                   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
                   │  Document    │          │  Resume     │          │  Semantic   │
                   │  Parser      │─────────►│  Extractor  │─────────►│  Embedding  │
                   │  (pymupdf)   │          │  (LLM)      │          │  Service    │
                   └─────────────┘          └─────────────┘          └─────────────┘
                                                                    │
                                                                    ▼
                                                            ┌─────────────┐
                                                            │  Job Match   │
                                                            │  Analyzer   │
                                                            │  (Ollama)   │
                                                            └─────────────┘
```

**Key Components**:
- `backend/app/v1/routes/resume_upload.py` - Upload endpoints
- `backend/app/v1/services/resume_upload/` - Upload service package
- `backend/app/v1/core/extractor.py` - Document parsing & LLM extraction
- `backend/app/v1/core/embeddings/service.py` - Semantic embedding generation
- `backend/app/v1/core/analyzer.py` - Resume vs JD analysis

### 3. Job & Candidate Management
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Admin Jobs    │───►│  Job Service    │───►│  PostgreSQL     │
│  Dashboard      │    │                 │    │  (Jobs/Cands)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Candidate      │
                       │  Repository     │
                       └─────────────────┘
```

**Key Components**:
- `backend/app/v1/routes/jobs.py` - Job CRUD endpoints
- `backend/app/v1/routes/candidates.py` - Candidate search/retrieval
- `backend/app/v1/services/job_service.py` - Job business logic
- `backend/app/v1/repository/candidate_repository.py` - Candidate data access
- `backend/app/v1/db/models/jobs.py` - Job ORM model
- `backend/app/v1/db/models/candidates.py` - Candidate ORM model (with pgvector)

### 4. Interview Stages Pipeline
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Stage Config   │───►│  Stage Service  │───►│  Interview      │
│  (Templates)    │    │                 │    │  Evaluations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  Stage 1     │    │  Stage 2     │    │  Stage N     │
   │  HR Round    │    │  Technical   │    │  Panel       │
   └─────────────┘    └─────────────┘    └─────────────┘
```

**Key Components**:
- `backend/app/v1/routes/admin.py` - Stage template management
- `backend/app/v1/services/stage_service.py` - Stage business logic
- `backend/app/v1/db/models/job_stage_configs.py` - Stage configuration
- `backend/app/v1/db/models/stage_templates.py` - Stage templates
- `frontend/src/components/candidate/Stage1HRRound.tsx` - HR evaluation UI

### 5. Admin & Analytics
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Admin Panel    │───►│  Admin Service  │───►│  Analytics      │
│  (Frontend)     │    │                 │    │  Engine         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  User Mgmt   │    │  Role Mgmt  │    │  Audit Logs  │
   └─────────────┘    └─────────────┘    └─────────────┘
```

**Key Components**:
- `backend/app/v1/services/admin_service.py` - Admin operations
- `backend/app/v1/services/admin/` - Sub-admin services
- `backend/app/v1/repository/admin_repository.py` - Admin data access
- `frontend/src/pages/Admin/` - Admin dashboard pages
- `frontend/src/apis/admin/` - Admin API client

---

## Key Execution Flows

### 1. Resume Upload & AI Screening Flow
```mermaid
sequenceDiagram
    participant HR as HR User
    participant FE as Frontend
    participant BE as FastAPI Backend
    participant EX as Resume Executor
    participant PG as PostgreSQL/pgvector
    participant LM as Ollama LLM
    participant RD as Redis Cache

    HR->>FE: Upload Resume (PDF/DOCX)
    FE->>BE: POST /api/v1/jobs/{job_id}/resume
    BE->>EX: Submit to ThreadPool
    BE-->>FE: 202 Accepted (processing)
    
    Note over EX: Background Processing
    EX->>PG: Save file & create record
    
    EX->>EX: Extract text (pymupdf/docx2txt)
    EX->>LM: Extract structured info (LLM)
    EX->>PG: Store extractions
    
    EX->>RD: Check job embedding cache
    alt Cache Hit
        RD-->>EX: Return cached embedding
    else Cache Miss
        EX->>EX: Generate job embedding
        EX->>RD: Cache job embedding
    end
    
    EX->>EX: Generate candidate embedding
    EX->>EX: Calculate semantic similarity
    EX->>LM: Analyze resume vs JD
    EX-->>PG: Store analysis results
    
    HR->>FE: Poll resume status
    FE->>BE: GET /api/v1/jobs/{job_id}/resume/{resume_id}
    BE->>PG: Fetch status & analysis
    BE-->>FE: Return status + scores
    FE-->>HR: Display match percentage & gaps
```

### 2. Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant FE as Frontend
    participant BE as FastAPI
    participant DB as PostgreSQL

    User->>FE: Login (email/password)
    FE->>BE: POST /api/v1/users/login
    BE->>DB: Validate credentials
    DB-->>BE: User data + roles
    BE->>BE: Generate JWT token
    BE-->>FE: Return token
    FE->>FE: Store in Redux
    FE->>FE: Redirect to dashboard
    
    Note over User,BE: Subsequent Requests
    User->>FE: Access protected route
    FE->>BE: Request + JWT header
    BE->>BE: Verify JWT + check permissions
    alt Valid
        BE-->>FE: Return data
    else Invalid
        BE-->>FE: 401/403 Error
    end
```

### 3. Candidate Search Flow
```mermaid
sequenceDiagram
    participant HR as HR User
    participant FE as Frontend
    participant BE as FastAPI
    participant PG as PostgreSQL

    HR->>FE: Search candidates
    FE->>BE: GET /api/v1/candidates/search?query=...
    BE->>PG: Full-text + vector search
    PG-->>BE: Ranked candidates (RRF)
    BE-->>FE: Candidate list
    FE-->>HR: Display results
```

### 4. Interview Stage Evaluation Flow
```mermaid
sequenceDiagram
    participant HR as HR User
    participant FE as Frontend
    participant BE as FastAPI
    participant DB as PostgreSQL

    HR->>FE: View candidate evaluations
    FE->>BE: GET /api/v1/candidates/{id}/evaluations
    BE->>DB: Fetch all stage evaluations
    BE-->>FE: Return evaluations with scores
    FE-->>HR: Display stage-by-stage breakdown
    
    HR->>FE: Submit stage evaluation
    FE->>BE: POST stage evaluation data
    BE->>DB: Store evaluation
    BE-->>FE: Confirmation
```

---

## System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Frontend Layer"]
        FE[React SPA<br/>Vite + TypeScript]
        RT[React Router v7]
        STL[Redux Toolkit<br/>State Management]
        FM[React Hook Form<br/>+ Zod]
        UI[React Bootstrap<br/>UI Components]
    end

    subgraph API["Backend API Layer"]
        AP[FastAPI<br/>ASGI Server]
        MW[Middleware<br/>CORS/Error/Logging]
        RT_V1[v1 API Router]
    end

    subgraph Services["Service Layer"]
        AUTH[Auth Service<br/>JWT/BCrypt]
        JOB[Job Service]
        CAND[Candidate Service]
        RES[Resume Upload Service]
        ADMIN[Admin Service]
        STAGE[Stage Service]
    end

    subgraph ML["AI/ML Layer"]
        EMB[Embedding Service<br/>Sentence Transformers]
        EXT[Document Extractor<br/>pymupdf/docx2txt]
        ANL[Resume Analyzer<br/>Ollama/DSPy]
        SIM[Similarity Engine<br/>pgvector]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL<br/>+ pgvector)]
        RD[(Redis<br/>Cache)]
        FS[File Storage<br/>Local/S3]
    end

    subgraph Models["Database Models"]
        USR[User]
        ROLE[Role]
        PERM[Permission]
        JOB[Job]
        CAND[Candidate]
        RESM[Resume]
        STG[StageConfig]
        STG_T[StageTemplate]
        FILE[File]
        AUD[AuditLog]
    end

    FE --> RT --> STL
    FE --> FM
    FE --> UI
    FE -->|REST API| AP
    
    AP --> MW
    MW --> RT_V1
    
    RT_V1 --> AUTH
    RT_V1 --> JOB
    RT_V1 --> CAND
    RT_V1 --> RES
    RT_V1 --> ADMIN
    RT_V1 --> STAGE
    
    AUTH -->|Verify| PG
    JOB -->|CRUD| PG
    CAND -->|Search| PG
    RES -->|Process| FS
    RES -->|Background| ML
    RES -->|Store| PG
    
    RES -->|Cache| RD
    RES -->|Embeddings| EMB
    
    ML --> EMB
    ML --> EXT
    ML --> ANL
    ML --> SIM
    
    PG --> Models
    SIM -->|Vector Search| PG
    
    ADMIN -->|Analytics| PG
    ADMIN -->|Audit| AUD
```

---

## Database Schema Overview

```mermaid
erDiagram
    User ||--o{ Role : "has"
    Role ||--o{ Permission : "grants"
    User ||--o{ AuditLog : "creates"
    
    Job ||--o{ Candidate : "attracts"
    Candidate ||--o{ Resume : "submits"
    Candidate ||--o{ File : "uploads"
    Candidate ||--o{ Interview : "participates"
    Job ||--o{ JobSkill : "requires"
    Candidate ||--o{ CandidateSkill : "has"
    Job ||--o{ JobStageConfig : "defines"
    JobStageConfig ||--o| StageTemplate : "uses"
    Interview ||--o{ InterviewTranscript : "generates"
    
    User {
        uuid id PK
        string email
        string hashed_password
        string first_name
        string last_name
        bool is_active
        datetime created_at
    }
    
    Role {
        uuid id PK
        string name
        string description
    }
    
    Permission {
        uuid id PK
        string code
        string description
    }
    
    Job {
        uuid id PK
        string title
        text description
        string location
        string employment_type
        bool is_active
        datetime created_at
    }
    
    Candidate {
        uuid id PK
        uuid applied_job_id FK
        string first_name
        string last_name
        string email
        jsonb info
        vector info_embedding
        float rrf_score
        string current_status
        datetime created_at
    }
    
    Resume {
        uuid id PK
        uuid candidate_id FK
        uuid uploaded_by FK
        string file_path
        string file_type
        string status
        jsonb extracted_info
        jsonb analysis_result
        datetime created_at
    }
    
    JobStageConfig {
        uuid id PK
        uuid job_id FK
        uuid template_id FK
        int stage_order
        jsonb config
    }
    
    StageTemplate {
        uuid id PK
        string name
        string description
        jsonb stages
    }
```

---

## API Endpoints Summary

### Authentication (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | User login |
| POST | `/register` | User registration |
| GET | `/me` | Get current user |

### Resume Upload (`/api/v1/jobs/{job_id}`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/resume` | Upload resume for job |
| GET | `/candidates` | List job candidates |
| GET | `/resume/{resume_id}` | Get resume status |

### Candidates (`/api/v1/candidates`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search candidates |
| GET | `/jobs/{job_id}` | Get job candidates |
| GET | `/{candidate_id}/evaluations` | Get evaluations |

### Jobs (`/api/v1/jobs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List jobs |
| GET | `/{job_id}` | Get job details |
| POST | `/` | Create job |
| PATCH | `/{job_id}` | Update job |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| POST | `/users` | Create user |
| GET | `/roles` | List roles |
| POST | `/roles` | Create role |
| GET | `/permissions` | List permissions |
| GET | `/audit-logs` | View audit logs |
| GET | `/analytics` | Get analytics summary |
| GET | `/hiring-report` | Get hiring report |
| GET | `/stage-templates` | List stage templates |

---

## Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                        Infrastructure                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│   │   Nginx     │─────►│   FastAPI    │─────►│  PostgreSQL │    │
│   │   (Proxy)   │      │   Backend   │      │  + pgvector │    │
│   └─────────────┘      └──────┬──────┘      └─────────────┘    │
│                               │                                    │
│                               ▼                                    │
│                        ┌─────────────┐      ┌─────────────┐    │
│                        │   Redis     │      │   Ollama    │    │
│                        │   Cache     │      │   (LLM)     │    │
│                        └─────────────┘      └─────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security

- **Authentication**: JWT tokens with expiration
- **Password Hashing**: BCrypt
- **Authorization**: Role-Based Access Control (RBAC)
- **Permissions**: Granular permission system (e.g., `users:read`, `jobs:manage`)
- **Input Validation**: Pydantic models for all API inputs
- **CORS**: Configured allowed origins
- **Audit Logging**: All admin actions are logged

---

## Application Workflow

The platform operates on a structured, multi-stage workflow powered by a modern backend API and a responsive React frontend.

1. **Authentication & Authorization**: Users log in via the React frontend. The FastAPI backend authenticates them using JWT and assigns roles (Admin, HR Manager, Recruiter). Protected routing ensures users only access permitted areas.
2. **Job & Candidate Management**: Authorized users can view, create, or manage job postings using the dashboard. FastCRUD handles these database operations efficiently on the backend.
3. **Resume Upload & AI Pre-Filter**:
   - HR uploads candidate resumes (PDF/DOCX).
   - The frontend sends the file to the backend (`resume_upload` endpoints).
   - The backend parses the resume extracting text (using `pymupdf` or `docx2txt`), generates semantic embeddings utilizing Sentence Transformers, and stores them in PostgreSQL via pgvector.
   - The AI matches the resume against the Job Description (JD) and returns a Pass/Fail status along with skill gap analysis.
4. **Interview Stages Processing**: As candidates progress through additional interview stages (HR Screening, Technical Practical, Panel Evaluation), their audio/video recordings are uploaded.
5. **AI Evaluation**: The backend's AI components transcribe the media, apply LLM-as-a-Judge criteria (via DSPy for prompt optimization), and return evaluated technical and behavioral scores.
6. **Result Visualization & Analytics**: Evaluated results, match percentages, strengths, weaknesses, and comprehensive audit logs are aggregated and visualized on the administrative dashboard via sortable Data Tables.

### User Journey Diagram

```mermaid
journey
    title HR Professional's Hiring Journey
    section Authentication
      Login to Platform: 5: HR
      Role Verification & Dashboard Access: 5: System
    section Job & Resume Management
      Select Job Opening: 4: HR
      Upload Candidate Resume: 4: HR
      AI Resume Screening & Fit Analysis: 5: System
      Review Resume Score (Pass/Fail): 4: HR
    section Interview Stages
      Upload Stage 1 Recording: 3: HR
      View Stage 1 Summary & Score: 4: HR
      Upload Stage 2 Practical Video: 3: HR
      View Practical Score: 4: HR
      Upload Stage 3 Recording: 3: HR
      View Final Score & Insights: 5: HR
    section Final Decision
      Download Candidate Report: 5: HR
```
