# Backend Setup

This backend follows a package-based feature layout.

Working code is split into:

- `app/`: application entry point and shared infrastructure
- `app/v1/`: version 1 of the API (config, database, router, services, repositories)
- `test/`: test suite
- `seed/`: database seeding scripts

## Prerequisites

- Python `3.14+`
- `uv`
- PostgreSQL (with pgvector)
- Redis (for caching & Celery broker)
- Docker (for containerized services)

### Installing uv

uv is a fast Python package manager.

**Windows (PowerShell):**

```powershell
irm https://astral.sh/uv/install.ps1 | iex
```

**macOS / Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Verify installation:**

```bash
uv --version
```

### Installing PostgreSQL

**Windows:**

- Download from [postgresql.org](https://www.postgresql.org/download/windows/) or use [PostgreSQL Portable](https://github.com/garethflowers/postgresql-portable)
- Alternatively, use Docker (see below)

**macOS:**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Installing Redis

**Windows:**

- Redis does not run natively on Windows. Use [WSL2](https://docs.microsoft.com/en-us/windows/wsl/), Docker
- Alternative: Use Docker (see below)

**macOS:**

```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

### Installing Docker (optional but recommended)

Docker can run PostgreSQL and Redis without native installation.

**Windows:**

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Enable WSL2 backend in Docker Desktop settings

**macOS:**

```bash
brew install --cask docker
```

**Linux:**

```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker
sudo usermod -aG docker $USER
```

### Running with Docker Compose (Recommended)

Docker Compose manages the application, PostgreSQL, Redis, and the Celery worker.

**1. Build and start services:**

```bash
docker-compose up --build
```

**2. Access the API:**

The app will be available at `http://localhost:8000`.

**3. Stopping services:**

```bash
docker-compose down
```

### Running PostgreSQL and Redis with Docker (Individual)

If you prefer to run only the dependencies in Docker and the application locally:

```bash
# PostgreSQL
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app \
  -p 5432:5432 \
  postgres:16

# Redis
docker run -d --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

Stop and remove containers when done:

```bash
docker stop postgres redis
docker rm postgres redis
```

## 1. Install dependencies

```bash
uv sync
```

## 2. Create environment file

Create `.env` in the project root from the example:

```bash
cp .env.example .env
```

If you are on PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Minimum variables:

- `PROJECT_NAME`
- `DEBUG`
- `POSTGRES_SERVER`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `REDIS_URL` (e.g., redis://localhost:6379/0)

You can also set `SQLALCHEMY_DATABASE_URI` directly instead of composing it from the Postgres variables.

## 3. Start PostgreSQL

Make sure the target database exists and is reachable with the values in `.env`.

Default connection used by the app:

```text
postgresql+asyncpg://postgres:postgres@localhost/app
```

## 4. Run the API

### Start Celery Worker (In a separate terminal)
This is required for resume parsing and analysis:
```bash
uv run celery -A app.core.celery_app worker --loglevel=info --pool=solo
```

### Start FastAPI Server
Use either command:

```bash
uv run fastapi dev app/main.py
```

```bash
uv run uvicorn app.main:app --reload
```

## 5. Verify

After startup, open:

- `http://localhost:8000/`
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

Current API endpoints:

- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/jobs`
- `POST /api/v1/jobs`
- `GET /api/v1/candidates`
- `POST /api/v1/candidates`
- `GET /api/v1/skills`
- `POST /api/v1/skills`
- `POST /api/v1/jobs/{job_id}/resume` (resume screening)
- `/api/v1/admin/*` (admin routes)

## Project Structure

The active project structure is:

```text
app/
  main.py                    # FastAPI entry point
  core/
    celery_app.py            # Celery application setup
    cache.py                 # Redis global cache utility
  v1/
    api/
      main.py                 # Top-level router composition
    core/                     # Config, security, embeddings, extractor
    db/
      models/                 # SQLAlchemy models
      session.py              # Async engine + session maker
    routes/                   # API route handlers
    services/                 # Business logic & Celery tasks
    repository/               # Data access layer
    schemas/                  # Pydantic schemas
    prompts/                  # LLM prompts
    dependencies/             # FastAPI dependencies
    utils/                    # Utility functions
```

Rules used in this repo:

- All feature code lives in `app/v1/` under appropriate subdirectories
- `app/v1/api/main.py` acts as the top-level router composition layer
- imports from shared infrastructure use `app.v1.db.*` and `app.v1.core.*` prefixes
- Models are in `app/v1/db/models/`
- Services are in `app/v1/services/`
- Repositories are in `app/v1/repository/`
- Routes are in `app/v1/routes/`

## Notes

- Passwords are hashed using bcrypt before storage.
- `app/v1/core/config.py` handles settings from `.env`.
- Redis is used for both caching (Job Embeddings) and as a broker for Celery.
