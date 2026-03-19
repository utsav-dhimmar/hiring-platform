# Setup Guide

This guide covers the complete setup process for the HR Platform Frontend.

## Prerequisites

Ensure you have the following installed:

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Backend API** running at `http://localhost:8000`

## Installation Steps

### 1. Clone and Navigate

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages defined in `package.json`.

### 3. Environment Configuration

Copy the example environment file:

```bash
# Linux/Mac
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Edit `.env` to configure the API URL:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Development Workflow

### Running the App

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Connecting to Backend

The frontend expects the backend API to be running. If the backend is on a different port or host, update `VITE_API_URL` in your `.env` file.

## Project Structure Overview

```
src/
├── apis/           # API calls and client configuration
├── components/     # Reusable UI components
│   ├── auth/      # Authentication components
│   ├── common/    # Shared components (Button, Card, Input, etc.)
│   └── modal/     # Modal dialogs for CRUD operations
├── css/           # Stylesheets
├── hooks/         # Custom React hooks
├── pages/         # Page components
│   └── Admin/     # Admin dashboard and management pages
├── routes/        # Route definitions
├── schemas/       # Zod validation schemas
├── store/         # Redux state management
└── utils/         # Utility functions
```

## Common Issues

### CORS Errors

If you encounter CORS errors, ensure the backend allows requests from `http://localhost:5173` or update the backend CORS configuration.

### API Connection Failed

- Verify the backend is running
- Check `VITE_API_URL` in `.env`
- Ensure the backend URL is accessible

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Available Admin Features

Once logged in as an admin, you can access:

- **Dashboard** - Overview statistics and metrics
- **Users** - Manage system users
- **Jobs** - Create and manage job postings
- **Skills** - Manage candidate skills
- **Roles** - Configure user roles and permissions
- **Audit Logs** - View system activity logs
- **Candidate Search** - Search across all candidates
- **Recent Uploads** - View recently uploaded resumes
