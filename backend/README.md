# HR Platform Backend

A modern FastAPI backend for the HR Platform.

## Features

- **FastAPI**: Modern, high-performance web framework.
- **SQLAlchemy**: Powerful SQL toolkit and ORM.
- **FastCRUD**: Robust and flexible CRUD operations.
- **Pydantic V2**: Data validation and settings management.
- **Asynchronous**: Built for speed and efficiency.

## Getting Started

### Prerequisites

- Python 3.13+
- [uv](https://github.com/astral-sh/uv) (recommended)
- PostgreSQL

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

## Project Structure

```text
backend/
├── app/                     # Main entry points
│   └── v1/                  # API version 1
│       ├── api/             # API router composition
│       ├── core/            # App configurations & settings
│       └── db/              # Database session & models
├── packages/                # Shared feature packages
│   └── auth/v1/             # Auth domain
├── pyproject.toml           # Project dependencies
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker compose setup
└── .env                     # Environment variables
```
