# Backend Setup

This backend follows a package-based feature layout.

Working code is split into:

- `app/`: application entry point, config, database, and router composition
- `packages/auth/v1/`: auth domain code for API routes, schemas, services, repositories, and models

## Prerequisites

- Python `3.13+`
- `uv`
- PostgreSQL
- Redis (for caching/sessions)
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

**Running PostgreSQL and Redis with Docker:**

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

You can also set `SQLALCHEMY_DATABASE_URI` directly instead of composing it from the Postgres variables.

## 3. Start PostgreSQL

Make sure the target database exists and is reachable with the values in `.env`.

Default connection used by the app:

```text
postgresql+asyncpg://postgres:postgres@localhost/app
```

## 4. Run the API

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

Current package-routed user endpoints:

- `GET /api/v1/users`
- `POST /api/v1/users`

## Package Pattern

The active package structure is:

```text
app/
  main.py              # FastAPI entry point
  api/
    v1/
      api.py           # Top-level router composition
  core/
    config.py          # Pydantic settings (.env)
  db/
    base_class.py      # SQLAlchemy declarative base
    session.py         # Async engine + session maker

packages/
  auth/
    v1/
      api/
        routes/
      models/
      repository/
      schema/
      services/
```

Rules used in this repo:

- shared config, middleware, exception handling, and database session stay in `app/`
- feature-specific code lives under `packages/<feature>/<version>/`
- `app/api/v1/api.py` acts as the top-level router composition layer
- imports from shared infrastructure use `app.db.*` and `app.core.*` prefixes

## Notes

- Passwords are still stored as plain text in the current user service placeholder and should be replaced with proper hashing before production use.
- `packages/auth/.env` is not used by the runtime; the application reads the root `.env`.
