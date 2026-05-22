# Backend Setup

This backend follows a package-based feature layout, optimized for scalability and clarity. 

---

## 🚀 Option 1: Running with Docker (Recommended)

Docker Compose provides the most stable environment by containerizing the API, Worker, Database, Redis, and PGAdmin into a single network.

### Prerequisites

*   [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
*   WSL2 enabled (if on Windows).

### Steps

1.  **Configure Environment**:
    Create a `.env` file in the root directory (using `.env.example` as a template).
    ```bash
    cp .env.example .env
    ```

2.  **Start Services**:
    From the project root, run:
    ```bash
    docker-compose up --build
    ```

3.  **Access Services**:
    *   **API**: [http://localhost:8000/docs](http://localhost:8000/docs)
    *   **PGAdmin**: [http://localhost:5050](http://localhost:5050) (Login with credentials in `.env`)
    *   **Redis**: `localhost:6379`

4.  **Stopping services**:
    ```bash
    docker-compose down
    ```

---

## 🛠️ Option 2: Running Without Docker (Local Development)

Ideal for active development with faster hot-reloading and direct integration with local tools.

### Prerequisites

*   **Python 3.14+**
*   **[uv](https://astral.sh/uv/)** (Fast Python package manager)
    - Windows: `irm https://astral.sh/uv/install.ps1 | iex`
    - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
*   **PostgreSQL 16+** with **[pgvector](https://github.com/pgvector/pgvector)** extension.
*   **Redis 7+** (For caching and Celery broker).

### 1. Install Dependencies

```bash
uv sync
```

### 2. Configure Environment

Create `.env` in the `backend/` directory from the example:

```bash
cp .env.example .env
```

*Ensure the following are correctly configured:*
- `POSTGRES_SERVER`
- `POSTGRES_USER` / `POSTGRES_PASSWORD`
- `POSTGRES_DB` (e.g., `app`)
- `REDIS_URL` (e.g., `redis://localhost:6379/0`)

### 3. Database Initialization

1. Create a database named `app` (or as specified in your `.env`).
2. Enable the **pgvector** extension using the provided script:
   ```bash
   psql -d app -f setup_extensions.sql
   ```
   *Note: This is required for vector-based resume screening.*

### 4. Running the Application

You need to run two processes in separate terminals:

**Terminal 1: Celery Worker**
Required for heavy background tasks like resume parsing and LLM analysis.
```bash
uv run celery -A app.v1.core.celery_app worker --loglevel=info --pool=solo
```

**Terminal 2: FastAPI Server**
```bash
uv run fastapi dev app/main.py
# or uv run uvicorn --app-dir backend app.main:app --reload
```

---

## 🔍 Verification

After startup, verify the backend is running correctly:

- **Root Endpoint**: [http://localhost:8000/](http://localhost:8000/)
- **Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Redoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints:
- `GET /api/v1/jobs` - List jobs
- `GET /api/v1/candidates` - List candidates
- `POST /api/v1/jobs/{job_id}/resume` - Screen a resume

---

## 📁 Project Structure

The project follows a modular architecture for clarity and maintainability:

```text
app/
  main.py                    # FastAPI entry point & lifespan events
  core/
    celery_app.py            # Celery application setup
    cache.py                 # Redis global cache utility
  v1/
    api/
      main.py                 # Top-level router composition
    core/                     # Global Config, Security, Embeddings
    db/
      models/                 # SQLAlchemy domain models
      session.py              # Async engine & session management
    routes/                   # API route handlers (Controllers)
    services/                 # Business logic & Celery tasks
    repository/               # Data access logic (CRUD)
    schemas/                  # Pydantic data validation
    prompts/                  # LLM integration prompts
```

---

## 💡 Notes

- **Automatic Tables**: The application uses `Base.metadata.create_all` in `app/main.py`. Tables are automatically created on startup if they do not exist.
- **Passwords**: Hashed via bcrypt before storage.
- **Worker Configuration**: The `--pool=solo` flag is mandatory for Celery when running on Windows.
- **Database URI**: If preferred, `SQLALCHEMY_DATABASE_URI` can be set directly in `.env`.

