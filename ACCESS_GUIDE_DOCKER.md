# ZIPPO Access Guide - Docker

This guide explains how to run ZIPPO with Docker.

## Overview

ZIPPO uses:

- React + Vite for the frontend
- FastAPI for the backend
- Supabase for authentication and database storage
- Docker Compose for containerized local development

## Requirements

Install these first:

- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Clone the Repository

```bash
git clone https://github.com/Thalanas110/zippo.git
cd zippo
```

Or download the repository ZIP, extract it, and open the folder in VS Code.

## Supabase Requirement

Full functionality requires a Supabase project because ZIPPO uses Supabase for:

- authentication
- database operations
- seeded demo data

If you do not have Supabase access, you may still be able to inspect the code, but the full system will not work correctly.

## Environment Setup

Create `backend/.env` from the example:

### PowerShell

```powershell
Copy-Item backend/.env.example backend/.env
```

### macOS / Linux

```bash
cp backend/.env.example backend/.env
```

Then fill in your real values:

```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SCHEMA_NAME="zippo"
```

The frontend API base URL is already provided by `docker-compose.yml`.

## Start Docker Desktop

Open Docker Desktop and wait until Docker is fully running.

## Run the System

From the project root:

```bash
docker compose up --build -d
```

## Check Status

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## Stop the System

```bash
docker compose down
```

## Rebuild After Changes

```bash
docker compose up --build -d
```

## Local URLs

- Frontend: `http://127.0.0.1:5173`
- Login: `http://127.0.0.1:5173/login`
- Backend health: `http://127.0.0.1:8000/health`

## Build

### Full stack

```bash
docker compose up --build -d
```

### Backend image only

```bash
docker build -t zippo-backend ./backend
```

### Frontend image only

```bash
docker build --target prod --build-arg VITE_PYTHON_API_BASE_URL=http://localhost:8000 -t zippo-frontend ./frontend
```

## Test

### Backend tests from host

#### Windows PowerShell

```powershell
python -m unittest discover -s backend\tests -p "test_*.py"
```

#### macOS / Linux

```bash
python -m unittest discover -s backend/tests -p "test_*.py"
```

### Frontend build check

```bash
cd frontend
npm run build
```

## Demo Accounts

If your Supabase project has already been seeded with demo data, these accounts may be available:

- Buyer: `demo-buyer-20260514@zippo.local`
- Vendor: `demo-vendor-20260514@zippo.local`
- Admin: `demo-admin-20260514@zippo.local`

Password:

```text
ZippoDemo!2026
```

## Common Issues

### Docker containers do not start

Make sure Docker Desktop is running before using:

```bash
docker compose up --build -d
```

### Frontend loads but actions fail

Check:

- backend health at `http://127.0.0.1:8000/health`
- `backend/.env` has valid Supabase values

### Auth does not work

Check that:

- `backend/.env` exists
- your Supabase keys are valid
- `http://127.0.0.1:8000/health` reports Supabase auth is configured

## Notes

- Never commit `.env` files
- Never put working secrets in `.env.example`
- Do not commit directly to `master`
- Use a branch and open a pull request
