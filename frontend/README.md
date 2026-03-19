# HR Platform Frontend

A React-based frontend for the HR Platform with authentication, job management, candidate tracking, and admin features.

## Features

- **React 19**: Latest React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Redux Toolkit**: State management
- **React Bootstrap**: UI component library
- **React Hook Form + Zod**: Form handling and validation
- **Axios**: HTTP client for API calls

## Prerequisites

- Node.js 18+
- npm or bun (optional)
- Backend API running at `http://localhost:8000`

## Setup

### 1. Install dependencies

```bash
npm install
```

Or with bun:

```bash
bun install
```

### 2. Configure environment

Create `.env` from the example:

```bash
cp .env.example .env
```

Or on Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

The default configuration connects to the local backend:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Start development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Build for production

```bash
npm run build
```

Production build output is in the `dist/` directory.

### 5. Preview production build

```bash
npm run preview
```

## Project Structure

```text
frontend/
├── src/
│   ├── apis/                 # API services
│   │   ├── admin/            # Admin API endpoints
│   │   ├── services/        # General API services
│   │   ├── types/           # TypeScript types
│   │   └── client.ts        # Axios client configuration
│   ├── assets/              # Static assets
│   ├── components/          # Reusable components
│   │   ├── admin/           # Admin-specific components
│   │   ├── auth/            # Auth components (ProtectedRoute, etc.)
│   │   └── common/          # Common UI components
│   ├── pages/               # Page components
│   │   ├── Admin/           # Admin pages (dashboard, users, jobs, etc.)
│   │   ├── Home/            # Home page
│   │   ├── JobCandidates/   # Job candidates page
│   │   └── Login/           # Login page
│   ├── routes/              # Route definitions
│   ├── schemas/             # Zod schemas
│   ├── store/               # Redux store
│   │   └── slices/          # Redux slices
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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## API Integration

The frontend expects the backend API to be running at `VITE_API_URL` (default: `http://localhost:8000/api/v1`).

### Authentication

The app uses JWT tokens stored in localStorage. Protected routes automatically redirect unauthenticated users to login.

### Available Pages

- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/jobs` - Job listings
- `/jobs/:id/candidates` - Candidates for a job
- `/admin` - Admin dashboard (requires admin role)
- `/admin/users` - User management
- `/admin/jobs` - Job management
- `/admin/skills` - Skill management
- `/admin/roles` - Role management
- `/admin/audit-logs` - Audit logs
- `/admin/analytics` - Analytics dashboard
