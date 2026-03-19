# HR Platform Frontend

A React-based frontend for the HR Platform with authentication, job management, candidate tracking, resume parsing, and comprehensive admin features.

## Features

- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router v7** - Client-side routing
- **Redux Toolkit** - State management
- **React Bootstrap** - UI component library
- **React Hook Form + Zod** - Form handling and validation
- **Axios** - HTTP client for API calls
- **Role-based Access Control** - Admin, HR Manager, Recruiter roles
- **Data Tables** - Sortable, searchable admin data tables
- **Modal Forms** - Create/edit resources with validation
- **Resume Parsing** - Upload and parse candidate resumes
- **Candidate Search** - Advanced search functionality
- **Audit Logs** - Track system activities
- **Analytics Dashboard** - Overview metrics and statistics

## Prerequisites

- Node.js 18+
- npm
- Backend API running at `http://localhost:8000`

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
frontend/
├── src/
│   ├── apis/                 # API services
│   │   ├── admin/            # Admin API endpoints
│   │   ├── services/        # General API services (auth, job, resume)
│   │   ├── types/           # TypeScript types
│   │   └── client.ts        # Axios client configuration
│   ├── assets/              # Static assets (images, logos)
│   ├── components/          # Reusable components
│   │   ├── auth/            # Auth components (ProtectedRoute, RoleRoute, PublicRoute)
│   │   ├── common/          # Common UI components
│   │   │                    # (Button, Card, Input, DataTable, Modal, etc.)
│   │   └── modal/           # Modal components
│   │                        # (CreateJob, CreateUser, CreateSkill, etc.)
│   ├── css/                  # CSS stylesheets
│   ├── hooks/               # Custom React hooks
│   │                        # (useAdminData, useFormModal, useDeleteConfirmation)
│   ├── pages/               # Page components
│   │   ├── Admin/           # Admin pages
│   │   │   ├── Layout/      # Admin layout
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   ├── AdminJobs.tsx
│   │   │   ├── AdminSkills.tsx
│   │   │   ├── AdminRoles.tsx
│   │   │   ├── AdminAuditLogs.tsx
│   │   │   ├── AdminCandidateSearch.tsx
│   │   │   └── AdminRecentUploads.tsx
│   │   ├── Home/            # Home page
│   │   ├── JobCandidates/   # Job candidates page
│   │   └── Login/           # Login page
│   ├── routes/              # Route definitions
│   ├── schemas/             # Zod validation schemas
│   ├── store/               # Redux store
│   │   ├── slices/          # Redux slices (auth)
│   │   └── hooks.ts        # Typed Redux hooks
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                  # Public static files
├── index.html               # HTML entry point
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── .env                     # Environment variables
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |

## Authentication & Authorization

The app uses JWT tokens stored in localStorage. Protected routes automatically redirect unauthenticated users to login.

**Role-based routes:**
- `/admin/*` - Requires admin role
- RoleRoute component for granular permission control

## Available Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Home page | Public |
| `/login` | User login | Public |
| `/register` | User registration | Public |
| `/jobs` | Job listings | Authenticated |
| `/jobs/:id/candidates` | Candidates for a job | Authenticated |
| `/admin` | Admin dashboard | Admin |
| `/admin/users` | User management | Admin |
| `/admin/jobs` | Job management | Admin |
| `/admin/skills` | Skill management | Admin |
| `/admin/roles` | Role management | Admin |
| `/admin/audit-logs` | Audit logs | Admin |
| `/admin/candidate-search` | Candidate search | Admin/HR |
| `/admin/recent-uploads` | Recent resume uploads | Admin/HR |

## Tech Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 8
- **Routing**: React Router v7
- **State Management**: Redux Toolkit
- **UI Library**: React Bootstrap 5.3
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Styling**: CSS + Bootstrap
