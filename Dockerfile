FROM python:3.14-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
ENV UV_HTTP_TIMEOUT=300
ENV UV_TCP_KEEPALIVE=1

# Copy dependency files
# We only copy the pyproject.toml and uv.lock so dependencies are cached properly
COPY uv.lock pyproject.toml ./

# Install dependencies without the application itself to maximize cache utilization
RUN uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application
COPY . .

# Install the application itself
RUN uv sync --frozen --no-dev

# Ensure the virtulal environment is active
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/backend"

# Run application commands from the backend package root
WORKDIR /app/backend

# Run the application
CMD ["fastapi", "run", "app/main.py", "--port", "8000"]
