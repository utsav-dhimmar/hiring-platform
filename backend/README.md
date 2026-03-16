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

### Running the Application

Start the development server:

```bash
uv run fastapi dev app/main.py
```

```bash
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```text
backend/
├── app/                     # Core application module
│   ├── main.py              # FastAPI entry point
│   ├── api/v1/api.py        # Top-level router composition
│   ├── core/config.py       # Pydantic settings (.env)
│   └── db/                  # Database session & base model
│       ├── base_class.py
│       └── session.py
├── packages/                # Feature packages
│   └── auth/v1/             # Auth domain
│       ├── api/routes/      # API route handlers
│       ├── models/          # SQLAlchemy models
│       ├── repository/      # Data access layer
│       ├── schema/          # Pydantic schemas
│       └── services/        # Business logic
├── pyproject.toml
└── .env
```
