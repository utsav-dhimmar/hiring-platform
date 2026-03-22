# Technology Best Practices and Standards

## Overview

This document outlines the coding standards, development workflows, and best practices followed in the Hiring Platform project to ensure code quality, maintainability, and reliable operation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BEST PRACTICES FRAMEWORK                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │                 │    │                 │    │                 │        │
│   │    Git Flow    │    │  Code Quality   │    │   Error         │        │
│   │    Workflow    │    │  Standards     │    │   Handling      │        │
│   │                 │    │                 │    │                 │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │                 │    │                 │    │                 │        │
│   │   Logging       │    │  CI/CD         │    │   Security      │        │
│   │   Strategy      │    │  Pipeline      │    │   Practices     │        │
│   │                 │    │                 │    │                 │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Git Flow

### Branching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GIT BRANCH STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   main ─────────────────────────────────────────────────────────────────►   │
│     │                                                                        │
│     │    ┌────────────────────────────────────────────────────────────┐    │
│     │    │                     develop                                  │    │
│     │    │  ─────────────────────────────────────────────────────────► │    │
│     │    └────────────────────────────────────────────────────────────┘    │
│     │          │              │              │              │             │
│     │          ▼              ▼              ▼              ▼             │
│     │    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│     │    │ feature/ │  │ feature/ │  │ bugfix/  │  │ release/ │        │
│     │    │    A     │  │    B     │  │    A     │  │    v1.0  │        │
│     │    └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│     │          │              │              │              │             │
│     │          └──────────────┴──────────────┘              │             │
│     │                                                         │             │
│     │    hotfix ─────────────────────────────────────────────┘             │
│     │      │                                                                   │
│     └──────┼────────────────────────────────────────────────────────────────► │
│            │                                                                   │
│            ▼                                                                   │
│      ┌──────────┐                                                              │
│      │ hotfix/  │                                                              │
│      │ critical │                                                              │
│      └──────────┘                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Branch Types

| Branch | Purpose | Source | Target | Naming Convention |
|--------|---------|--------|--------|-------------------|
| `main` | Production-ready code | release/* | - | - |
| `develop` | Integration branch | main | main, release/* | - |
| `feature/*` | New features | develop | develop | `feature/ticket-description` |
| `bugfix/*` | Bug fixes | develop | develop | `bugfix/ticket-description` |
| `hotfix/*` | Production fixes | main | main, develop | `hotfix/issue-description` |
| `release/*` | Release preparation | develop | main, develop | `release/v1.2.0` |

### Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, no logic change) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process or auxiliary tool changes |
| `ci` | CI/CD configuration changes |

**Examples:**
```
feat(resume-upload): add background processing for resume parsing

Implemented async processing to prevent API timeouts during large file uploads.
- Added ThreadPoolExecutor for CPU-bound operations
- Integrated with Redis queue for job status tracking

Closes #123
```

```
fix(auth): resolve token expiration handling

Fixed issue where expired JWT tokens were not properly handled,
causing unexpected 401 responses. Added refresh token logic.

Fixes #456
```

```
docs(api): update resume upload endpoint documentation

Added examples for both PDF and DOCX file uploads.
Included response schema for async processing status.
```

### Pull Request Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PR WORKFLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. Create Branch                                                          │
│      ┌─────────────────┐                                                    │
│      │ git checkout -b │                                                    │
│      │ feature/abc-123 │                                                    │
│      └────────┬────────┘                                                    │
│               │                                                             │
│               ▼                                                             │
│   2. Make Changes                                                           │
│      ┌─────────────────┐                                                    │
│      │ Write Code     │                                                    │
│      │ Write Tests    │                                                    │
│      │ Update Docs    │                                                    │
│      └────────┬────────┘                                                    │
│               │                                                             │
│               ▼                                                             │
│   3. Commit & Push                                                          │
│      ┌─────────────────┐                                                    │
│      │ git add .      │                                                    │
│      │ git commit -m  │                                                    │
│      │ git push origin│                                                    │
│      └────────┬────────┘                                                    │
│               │                                                             │
│               ▼                                                             │
│   4. Create PR                                                              │
│      ┌─────────────────┐                                                    │
│      │ PR Template    │                                                    │
│      │ • Description  │                                                    │
│      │ • Test Plan    │                                                    │
│      │ • Screenshots  │                                                    │
│      └────────┬────────┘                                                    │
│               │                                                             │
│               ▼                                                             │
│   5. Code Review                                                             │
│      ┌─────────────────┐                                                    │
│      │ • Linting      │                                                    │
│      │ • Type Check   │                                                    │
│      │ • Tests Pass   │                                                    │
│      │ • Review OK    │                                                    │
│      └────────┬────────┘                                                    │
│               │                                                             │
│               ▼                                                             │
│   6. Merge                                                                   │
│      ┌─────────────────┐                                                    │
│      │ Squash & Merge │                                                    │
│      │ Delete Branch  │                                                    │
│      └─────────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### PR Template

```markdown
## Description
[//]: # (Brief description of the changes)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
[//]: # (Link to related issues, e.g., "Closes #123")

## How Has This Been Tested?
[//]: # (Describe the tests you added or any manual testing performed)

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
```

---

## 2. Code Quality Standards

### Python (Backend)

**Style Guide:** PEP 8 with ruff formatting

| Tool | Purpose | Configuration |
|------|---------|---------------|
| `ruff` | Linting & formatting | `pyproject.toml` |
| `mypy` | Type checking | `pyproject.toml` |
| `pytest` | Testing | `pytest.ini` |

**Key Standards:**

```python
# 1. Type Hints Required
def process_resume(
    file_path: str,
    job_id: UUID,
    current_user: UserRead
) -> ResumeUploadResponse:
    """Process uploaded resume file."""
    ...

# 2. Async First
async def get_candidates_for_job(
    db: AsyncSession,
    job_id: UUID,
) -> JobCandidatesResponse:
    ...

# 3. Pydantic for Data Validation
class ResumeUploadResponse(BaseModel):
    resume_id: UUID
    candidate_id: UUID
    status: Literal["queued", "processing", "completed", "failed"]
    message: str

# 4. Docstrings for Public APIs
async def upload_resume_for_job(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    resume: UploadFile,
    db: AsyncSession,
    current_user: UserRead,
) -> ResumeUploadResponse:
    """Upload a resume for a specific job.

    This endpoint accepts a resume file, saves it to disk, and initiates
    asynchronous processing to extract information and analyze it.

    Args:
        job_id: The UUID of the job the resume is for.
        background_tasks: FastAPI background tasks.
        resume: The uploaded resume file.
        db: The async database session.
        current_user: The authenticated user performing the upload.

    Returns:
        A response indicating the upload was successful and processing has started.
    """
    ...

# 5. Dependency Injection
async def get_resume_status(
    job_id: uuid.UUID,
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> ResumeStatusResponse:
    ...
```

### TypeScript (Frontend)

**Style Guide:** ESLint + Prettier

| Tool | Purpose | Configuration |
|------|---------|---------------|
| `eslint` | Linting | `eslint.config.js` |
| TypeScript | Type checking | `tsconfig.json` |

**Key Standards:**

```typescript
// 1. Strict TypeScript
interface ResumeUploadResponse {
  resume_id: string;
  candidate_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
}

// 2. Functional Components with Hooks
function JobCandidatesPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  useEffect(() => {
    fetchCandidates(jobId);
  }, [jobId]);
  
  return <DataTable candidates={candidates} />;
}

// 3. Zod for Runtime Validation
const ResumeUploadSchema = z.object({
  resume_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
});

// 4. React Hook Form Integration
const { register, handleSubmit, formState: { errors } } = useForm<ResumeForm>({
  resolver: zodResolver(ResumeUploadSchema),
});

// 5. Component Props Interface
interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (id: string) => void;
  isSelected: boolean;
}
```

### File Organization

```
backend/app/
├── main.py                     # Application entry point
├── v1/
│   ├── api/
│   │   └── main.py            # Router aggregation
│   ├── core/                   # Core functionality
│   │   ├── config.py          # Configuration (Pydantic Settings)
│   │   ├── logging.py         # Logging setup
│   │   ├── middleware.py      # Custom middleware
│   │   ├── cache.py           # Redis cache
│   │   ├── security.py        # Security utilities
│   │   └── *.py               # AI/ML components
│   ├── db/
│   │   ├── base.py            # SQLAlchemy base
│   │   ├── base_class.py      # Base model class
│   │   ├── session.py         # Database session
│   │   └── models/            # ORM models
│   ├── dependencies/           # FastAPI dependencies
│   ├── routes/                # API endpoints
│   ├── services/              # Business logic
│   ├── repository/            # Data access layer
│   ├── schemas/               # Pydantic models
│   ├── prompts/               # LLM prompts
│   └── utils/                 # Utility functions

frontend/src/
├── apis/                     # API clients
│   ├── client.ts             # Axios instance
│   ├── services/             # Service modules
│   └── types/                # TypeScript types
├── components/               # React components
│   ├── auth/                 # Authentication
│   ├── common/               # Shared UI
│   └── modal/               # Modals
├── hooks/                    # Custom hooks
├── pages/                    # Page components
├── routes/                   # Routing
├── schemas/                  # Zod schemas
├── store/                    # Redux
└── utils/                    # Utilities
```

---

## 3. Error Handling

### Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ERROR HANDLING FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Request                                                                    │
│      │                                                                      │
│      ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      FASTAPI MIDDLEWARE                               │   │
│   │                                                                       │   │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │   │
│   │   │ CORSM       │───▶│ Global Error│───▶│   Request   │             │   │
│   │   │ Middleware  │    │   Handler   │    │   Logging   │             │   │
│   │   └─────────────┘    └──────┬──────┘    └─────────────┘             │   │
│   │                             │                                        │   │
│   │                    ┌────────┴────────┐                               │   │
│   │                    ▼                 ▼                               │   │
│   │             ┌─────────────┐   ┌─────────────┐                         │   │
│   │             │ HTTPException│   │ Validation  │                         │   │
│   │             │  Handler    │   │   Error     │                         │   │
│   │             └─────────────┘   └─────────────┘                         │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      APPLICATION LAYER                                │   │
│   │                                                                       │   │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │   │
│   │   │  Routes    │───▶│  Services   │───▶│ Repository  │             │   │
│   │   │            │    │             │    │             │             │   │
│   │   │ Try/Catch  │    │ Try/Catch   │    │ Try/Catch   │             │   │
│   │   └─────────────┘    └─────────────┘    └─────────────┘             │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   Response                                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Error Handling

#### Global Exception Handler

```python
# backend/app/v1/core/middleware.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import traceback

class GlobalErrorHandlerMiddleware:
    async def __call__(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except RequestValidationError as exc:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "error": "Validation Error",
                    "detail": exc.errors(),
                    "body": exc.body,
                }
            )
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": exc.detail,
                    "status_code": exc.status_code,
                }
            )
        except SQLAlchemyError as exc:
            logger.error(f"Database error: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Database error occurred",
                    "detail": "An unexpected database error occurred",
                }
            )
        except Exception as exc:
            logger.error(f"Unhandled exception: {traceback.format_exc()}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Internal Server Error",
                    "detail": "An unexpected error occurred",
                }
            )
```

#### Custom Exceptions

```python
# backend/app/v1/core/exceptions.py
from fastapi import HTTPException, status

class ResumeProcessingError(HTTPException):
    def __init__(self, detail: str = "Resume processing failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )

class CandidateNotFoundError(HTTPException):
    def __init__(self, candidate_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found",
        )

class JobNotFoundError(HTTPException):
    def __init__(self, job_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found",
        )

class FileValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )

class PermissionDeniedError(HTTPException):
    def __init__(self, action: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {action}",
        )
```

#### Service-Level Error Handling

```python
# Example service error handling
class ResumeUploadService:
    async def upload_resume_for_job(
        self,
        db: AsyncSession,
        job_id: UUID,
        resume: UploadFile,
        current_user: UserRead,
        background_tasks: BackgroundTasks,
    ) -> ResumeUploadResponse:
        try:
            # Validate file type
            if resume.content_type not in ALLOWED_MIME_TYPES:
                raise FileValidationError(
                    f"Invalid file type: {resume.content_type}. "
                    f"Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
                )
            
            # Check job exists
            job = await self.job_repository.get(db, job_id)
            if not job or not job.is_active:
                raise JobNotFoundError(str(job_id))
            
            # Process upload
            result = await self._process_upload(...)
            
            return ResumeUploadResponse(
                resume_id=result.id,
                status="queued",
                message="Resume uploaded successfully. Processing started."
            )
            
        except (FileValidationError, JobNotFoundError):
            raise
        except Exception as exc:
            logger.error(f"Resume upload failed: {exc}")
            raise ResumeProcessingError(str(exc))
```

### Frontend Error Handling

#### Axios Interceptors

```typescript
// frontend/src/apis/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../store';
import { logout, setAuthError } from '../store/slices/authSlice';
import { showToast } from '../utils/toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    switch (status) {
      case 401:
        store.dispatch(setAuthError(detail || 'Unauthorized'));
        store.dispatch(logout());
        showToast('Session expired. Please login again.', 'error');
        break;
        
      case 403:
        showToast(detail || 'Permission denied', 'error');
        break;
        
      case 404:
        showToast(detail || 'Resource not found', 'warning');
        break;
        
      case 422:
        showToast(detail || 'Validation error', 'warning');
        break;
        
      case 500:
        showToast('Server error. Please try again later.', 'error');
        break;
        
      case 502:
      case 503:
      case 504:
        showToast('Service temporarily unavailable.', 'error');
        break;
        
      default:
        if (status) {
          showToast(detail || 'An error occurred', 'error');
        }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### React Error Boundary

```typescript
// frontend/src/components/common/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Button, Card } from 'react-bootstrap';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="error-boundary-card">
          <Card.Body>
            <h5>Something went wrong</h5>
            <p className="text-muted">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button variant="primary" onClick={this.handleReload}>
              Reload Page
            </Button>
          </Card.Body>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## 4. Logging Strategy

### Logging Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LOGGING ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Application Code                                                          │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       PYTHON LOGGING                                  │   │
│   │                                                                       │   │
│   │   logger = get_logger(__name__)                                      │   │
│   │                                                                       │   │
│   │   logger.info("Resume processing started")                           │   │
│   │   logger.warning("LLM call took longer than expected")               │   │
│   │   logger.error("Failed to connect to database", exc_info=True)       │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       LOG FORMatters                                   │   │
│   │                                                                       │   │
│   │   {                                                           }       │   │
│   │     "timestamp": "2024-01-15T10:30:00.000Z",                        │   │
│   │     "level": "INFO",                                                 │   │
│   │     "logger": "app.v1.services.resume",                             │   │
│   │     "message": "Resume processing completed",                        │   │
│   │     "extra": {                                                       │   │
│   │       "resume_id": "abc-123",                                       │   │
│   │       "job_id": "xyz-456",                                          │   │
│   │       "processing_time_ms": 2500                                    │   │
│   │     }                                                                │   │
│   │   }                                                                   │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                         ┌────────────┴────────────┐                        │
│                         ▼                         ▼                        │
│                  ┌─────────────┐          ┌─────────────┐                   │
│                  │   Console   │          │    File     │                   │
│                  │   Output    │          │   Handler   │                   │
│                  └─────────────┘          └─────────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Backend Logging Configuration

```python
# backend/app/v1/core/logging.py
import logging
import sys
import json
from datetime import datetime, timezone
from typing import Any
from settings import settings

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if hasattr(record, "extra_fields"):
            log_data["extra"] = record.extra_fields
            
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
            
        if settings.DEBUG:
            log_data["debug"] = {
                "thread": record.thread,
                "process": record.process,
            }
            
        return json.dumps(log_data)


def setup_logging(debug: bool = False) -> None:
    """Configure application logging."""
    
    log_level = logging.DEBUG if debug else logging.INFO
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(console_handler)
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name)


class StructuredLogger:
    """Logger wrapper for structured logging with extra fields."""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        
    def _log(
        self,
        level: int,
        message: str,
        **kwargs: Any
    ) -> None:
        extra = {"extra_fields": kwargs}
        self.logger.log(level, message, extra=extra)
        
    def info(self, message: str, **kwargs: Any) -> None:
        self._log(logging.INFO, message, **kwargs)
        
    def warning(self, message: str, **kwargs: Any) -> None:
        self._log(logging.WARNING, message, **kwargs)
        
    def error(self, message: str, **kwargs: Any) -> None:
        self._log(logging.ERROR, message, **kwargs)
        
    def debug(self, message: str, **kwargs: Any) -> None:
        self._log(logging.DEBUG, message, **kwargs)
```

### Logging Best Practices

#### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `DEBUG` | Detailed debugging information | Variable values, loop iterations |
| `INFO` | Normal operation events | Request received, processing completed |
| `WARNING` | Potential issues | Slow LLM call, cache miss |
| `ERROR` | Error conditions | Failed database connection, invalid input |
| `CRITICAL` | System failures | Application crash, data corruption |

#### What to Log

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOGGING CHECKLIST                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ✓ DO LOG:                                                                │
│   ────────                                                                 │
│   • API request/response (INFO)                                            │
│   • Authentication events (INFO)                                            │
│   • Processing milestones (INFO)                                           │
│   • Performance metrics (INFO/WARNING)                                      │
│   • Errors with context (ERROR)                                            │
│   • Security events (WARNING)                                              │
│   • Background job start/completion (INFO)                                  │
│                                                                              │
│   ✗ DON'T LOG:                                                            │
│   ──────────                                                               │
│   • Passwords or tokens                                                    │
│   • PII (names, emails in detail)                                          │
│   • Large file contents                                                   │
│   • Third-party API keys                                                   │
│   • Database connection strings                                             │
│   • Debug loop iterations (use DEBUG level)                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Example Logging Statements

```python
# Good: Structured logging with context
logger.info(
    "Resume processing completed",
    resume_id=str(resume.id),
    candidate_id=str(candidate.id),
    job_id=str(job_id),
    processing_time_ms=int((end - start) * 1000),
    match_score=analysis.get("match_percentage", 0),
)

# Good: Error logging with exception
logger.error(
    "Failed to process resume",
    resume_id=str(resume.id),
    error=str(exc),
    exc_info=True,
)

# Good: Warning for degraded performance
logger.warning(
    "LLM call exceeded expected duration",
    duration_seconds=120,
    expected_max_seconds=60,
    model=settings.OLLAMA_MODEL,
)

# Bad: Missing context
logger.info("Resume processed")
logger.error("Error occurred")
```

### AI Component Logging

```python
# Log stage timing for AI processing
def log_stage(
    stage: str,
    started_at: float,
    file_path: str = None,
    **kwargs
) -> None:
    elapsed_ms = (time.perf_counter() - started_at) * 1000
    logger.info(
        f"Stage '{stage}' completed",
        stage=stage,
        duration_ms=int(elapsed_ms),
        file_path=file_path,
        **kwargs
    )

# Usage in processing pipeline
stage_started_at = time.perf_counter()
raw_text = DocumentParser.extract_text(file_path)
log_stage(
    stage="document_text_extraction",
    started_at=stage_started_at,
    file_path=file_path,
    chars=len(raw_text),
)
```

### Frontend Logging

```typescript
// frontend/src/utils/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private context: string;
  private static level = LogLevel.INFO;

  constructor(context: string) {
    this.context = context;
  }

  private format(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data }),
    });
  }

  debug(message: string, data?: unknown): void {
    if (Logger.level <= LogLevel.DEBUG) {
      console.debug(this.format('DEBUG', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (Logger.level <= LogLevel.INFO) {
      console.info(this.format('INFO', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (Logger.level <= LogLevel.WARN) {
      console.warn(this.format('WARN', message, data));
    }
  }

  error(message: string, data?: unknown): void {
    if (Logger.level <= LogLevel.ERROR) {
      console.error(this.format('ERROR', message, data));
      // Send to error tracking service (e.g., Sentry)
    }
  }
}

export const createLogger = (context: string) => new Logger(context);

// Usage
const logger = createLogger('ResumeUpload');
logger.info('Starting resume upload', { jobId, fileName });
logger.error('Upload failed', { error: error.message });
```

---

## 5. CI/CD Pipeline

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│   │          │    │          │    │          │    │          │              │
│   │  Commit  │───▶│  Build   │───▶│   Test   │───▶│  Lint   │              │
│   │  Push    │    │          │    │          │    │          │              │
│   │          │    │          │    │          │    │          │              │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                            │                │
│                                                            ▼                │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│   │          │    │          │    │          │    │          │              │
│   │   Deploy │◀───│ Staging  │◀───│   Type   │◀───│ Security │              │
│   │  Staging │    │  Tests   │    │  Check   │    │  Scan    │              │
│   │          │    │          │    │          │    │          │              │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│         │                                                                   │
│         │ (after PR approval)                                               │
│         ▼                                                                   │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                               │
│   │          │    │          │    │          │                               │
│   │  Deploy  │◀───│   QA     │◀───│  Deploy  │                               │
│   │  Prod    │    │  Signoff │    │  Build   │                               │
│   │          │    │          │    │          │                               │
│   └──────────┘    └──────────┘    └──────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quality Gates

| Gate | Tool | Pass Criteria |
|------|------|---------------|
| Unit Tests | pytest | 80%+ coverage, all pass |
| Type Check | mypy / tsc | No errors |
| Linting | ruff / eslint | No warnings/errors |
| Security Scan | bandit / npm audit | No high/critical vulnerabilities |
| Build | Docker / npm build | Successful |
| Integration Tests | pytest | All pass |

---

## 6. Security Best Practices

### Input Validation

```python
# Backend: Validate all inputs with Pydantic
class ResumeUploadRequest(BaseModel):
    job_id: UUID
    file: UploadFile
    
    @field_validator('file')
    @classmethod
    def validate_file(cls, v: UploadFile):
        allowed_types = {'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
        if v.content_type not in allowed_types:
            raise ValueError(f"Invalid file type: {v.content_type}")
        
        max_size = 10 * 1024 * 1024  # 10MB
        if v.size and v.size > max_size:
            raise ValueError(f"File too large: {v.size} bytes (max {max_size})")
        
        return v
```

### Authentication & Authorization

```python
# Backend: Dependency injection for auth
async def get_current_user(
    token: str = Depends(JWTBearer()),
    db: AsyncSession = Depends(get_db)
) -> UserRead:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_repository.get_by_id(db, UUID(user_id))
    if user is None:
        raise credentials_exception
        
    return UserRead.model_validate(user)

# Backend: Permission checking
def check_permission(permission: str):
    async def permission_checker(
        current_user: UserRead = Depends(get_current_user)
    ):
        if permission not in current_user.permissions:
            raise PermissionDeniedError(permission)
        return current_user
    return permission_checker

# Usage
@router.get("/users", response_model=list[UserAdminRead])
async def get_all_users(
    admin: UserRead = Depends(check_permission("users:read")),
):
    return await admin_service.get_all_users(db=db)
```

### Secrets Management

```python
# backend/app/v1/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Ollama
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama2"
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## Summary Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT CHECKLIST                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Before Committing:                                                        │
│   ──────────────────                                                        │
│   □ Code follows style guide (PEP 8 / ESLint)                              │
│   □ All type hints added (Python) / Types defined (TypeScript)              │
│   □ New code has tests                                                      │
│   □ Tests pass locally                                                      │
│   □ No debug/console.log statements                                          │
│   □ Commit message follows convention                                       │
│   □ No secrets or credentials committed                                     │
│   □ Documentation updated (if needed)                                       │
│                                                                              │
│   Before PR:                                                                │
│   ──────────                                                                │
│   □ CI/CD pipeline passes                                                    │
│   □ Code reviewed by peer                                                   │
│   □ All tests pass                                                          │
│   □ Security scan clean                                                     │
│   □ Performance implications considered                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
