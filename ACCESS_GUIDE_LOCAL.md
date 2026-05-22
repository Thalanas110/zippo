# ZIPPO Access Guide - Local

This guide explains how to run ZIPPO locally without Docker.

## Overview

ZIPPO uses:

- React + Vite for the frontend
- FastAPI for the backend
- Supabase for authentication and database storage

## Requirements

Install these first:

- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- [Node.js 20.x](https://nodejs.org/)
- [Python 3.11](https://www.python.org/)

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

Create `frontend/.env`:

```env
VITE_PYTHON_API_BASE_URL="http://localhost:8000"
```

## Run the Backend

### Windows PowerShell

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

### macOS / Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

## Run the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

## Local URLs

- Frontend: `http://127.0.0.1:5173`
- Login: `http://127.0.0.1:5173/login`
- Backend health: `http://127.0.0.1:8000/health`

## Build

### Frontend production build

```bash
cd frontend
npm run build
```

## Test

### Backend tests

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

### `npm run dev` fails in the repository root

Run it inside `frontend/`:

```bash
cd frontend
npm run dev
```

### Frontend API calls fail

Check that:

- backend is running on `http://localhost:8000`
- `frontend/.env` contains `VITE_PYTHON_API_BASE_URL="http://localhost:8000"`

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
