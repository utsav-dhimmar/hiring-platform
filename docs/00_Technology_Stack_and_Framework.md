# 00. Technology Stack and Framework

The Hiring Platform is built on a decoupled, full-stack architecture that segments the client-side user interface from the backend API processing. The tech stack is designed for high performance, scalability, and AI integration.

## Frontend (Client-Side)
The frontend is a modern, type-safe Single Page Application (SPA) providing a responsive and dynamic user experience.

- **Frontend Framework**: **React 19** (TypeScript)
- **Build Tool**: **Vite 8** for lightning-fast development and optimized production builds.
- **Routing**: **React Router v7** for robust client-side routing and data loading.
- **State Management**: **Redux Toolkit** for predictable and centralized application state.
- **UI Components**: **React Bootstrap 5.3** for standard, responsive, and customizable components.
- **Form Handling**: **React Hook Form** combined with **Zod** for schema-based validation.
- **HTTP Client**: **Axios** for standardized API communication with interceptors for global error/auth handling.

## Backend (API & Processing)
The backend is an asynchronous, high-performance API server built to handle complex AI workloads and database operations efficiently.

- **Web Framework**: **FastAPI** (Python 3.14+) utilizing `async/await` for high concurrency.
- **Object-Relational Mapping (ORM)**: **SQLAlchemy 2.0** integrated with **FastCRUD** for rapid and flexible database interactions.
- **Data Validation**: **Pydantic V2** for strict type checking, serialization, and settings management.
- **Database**: **PostgreSQL** with the **pgvector** extension for scalable storage and vector-based semantic search.
- **Caching**: **Redis** for managing application sessions, caching frequent embeddings, and tracking background task states.
- **Security**: **BCrypt** for password hashing and **JWT** for stateless, token-based authentication.

## AI & ML Components
The core logic of the platform leverages advanced natural language processing for resume analysis and interview evaluation.

- **Prompt Optimization**: **DSPy** for structured and optimized interaction with LLMs.
- **Semantic Embeddings**: **Sentence Transformers** (`all-MiniLM-L6-v2`) for generating candidate and JD vectors.
- **LLM Integration**: **Ollama** for hosting and running local Large Language Models (LLMs) used as "judges" for scoring.
- **Document Parsing**: **PyMuPDF (fitz)** and **docx2txt** for extracting text from PDFs and Word documents.
- **Scoring Engine**: **Reciprocal Rank Fusion (RRF)** for combining semantic and keyword-based candidate ranking.

## Infrastructure & Testing
- **Runtime Environment**: **Docker** & **Docker Compose** for containerized deployment and orchestration.
- **Dependency Management**: **uv** (Python) and **bun** (Frontend) for high-speed package management.
- **Testing Framework**: **pytest** and **pytest-asyncio** (Backend) and **ESLint** (Frontend) to maintain platform stability.
