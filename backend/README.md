# HR Platform Backend

A modern FastAPI backend for the HR Platform.

## Features

- **FastAPI**: Modern, high-performance web framework.
- **SQLAlchemy**: Powerful SQL toolkit and ORM.
- **FastCRUD**: Robust and flexible CRUD operations.
- **Pydantic V2**: Data validation and settings management.
- **Async**: Built for speed and efficiency with async/await.
- **PostgreSQL + pgvector**: Vector database for AI-powered resume matching.
- **Sentence Transformers**: Embedding-based candidate-job matching.
- **BCrypt**: Secure password hashing.
- **JWT**: Token-based authentication.
- **Background Processing**: Resume parsing and analysis.
- **Comprehensive Tests**: pytest-based test suite.

## Getting Started

### Prerequisites

- Python 3.14+
- [uv](https://github.com/astral-sh/uv) (recommended)
- PostgreSQL
- Redis (for caching/sessions)
- Docker (optional)

### Setup

1. **Clone the repository**
2. **Create environment file**
3. **Install dependencies**

```bash
uv sync
```

Optional embedding tuning in `.env`:

```env
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_VECTOR_DIM=1024
EMBEDDING_TRUNCATE_DIM=384
EMBEDDING_USE_INSTRUCTIONS=False
```

### Running the Application

#### Locally
Start the development server:

```bash
uv run fastapi dev app/main.py
```

```bash
uv run uvicorn app.main:app --reload
```

#### With Docker
Start the application and database:

```bash
docker-compose up --build
```

The API will be available at `http://localhost:8000`.
Documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Running Tests

```bash
pytest
```

### Seeding the Database

```bash
uv run seed-all
```

## Project Structure

```text
backend/
├── app/                     # Main application
│   ├── main.py              # FastAPI entry point
│   └── v1/                  # API version 1
│       ├── api/             # API router composition
│       ├── core/            # Config, security, embeddings, extractor
│       ├── db/
│       │   └── models/      # SQLAlchemy models
│       ├── routes/          # API endpoints
│       │   ├── users.py     # User/Auth routes
│       │   ├── jobs.py      # Job routes
│       │   ├── candidates.py # Candidate routes
│       │   ├── skills.py    # Skill routes
│       │   ├── resume_upload.py # Resume screening
│       │   └── admin.py     # Admin routes
│       ├── services/        # Business logic
│       ├── repository/      # Data access layer
│       ├── schemas/         # Pydantic schemas
│       ├── prompts/         # LLM prompts
│       ├── dependencies/    # FastAPI dependencies
│       └── utils/           # Utilities
├── test/                    # Test suite
│   ├── admin/               # Admin route tests
│   └── user/                # User service tests
├── seed/                    # Database seeding
├── pyproject.toml           # Project dependencies
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker compose setup
└── .env                     # Environment variables
```
