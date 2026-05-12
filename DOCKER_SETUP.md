# ZIPPO Docker Setup (Laptop)

This project is now containerized with Docker Compose:

- `backend`: FastAPI on `http://localhost:8000`
- `frontend`: Vite app on `http://localhost:5173`

## Why this works with Miniconda

Your laptop's Python/Miniconda environment is not used inside containers.
Docker ships its own Python runtime for backend, so local Conda conflicts are avoided.

## 1) Install prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Start Docker Desktop and wait until it says Docker is running.

## 2) Prepare environment files

From project root:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Then open `backend/.env` and `frontend/.env` and fill in your real values.

## 3) Build and run

From project root:

```powershell
docker compose up --build -d
```

## 4) Verify

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

Expected:

- backend health endpoint: `http://localhost:8000/health`
- frontend app: `http://localhost:5173`

## 5) Stop

```powershell
docker compose down
```

## Common commands

Rebuild after dependency/code changes:

```powershell
docker compose up --build -d
```

Restart without rebuild:

```powershell
docker compose restart
```

Remove containers and related networks:

```powershell
docker compose down
```

## Optional: run backend with Miniconda (without Docker backend)

If you still want local backend via Conda:

```powershell
cd backend
conda env create -f environment.yml
conda activate zippo-backend
python -m uvicorn app:app --reload --port 8000
```

Then you can run only frontend in Docker:

```powershell
cd ..
docker compose up --build -d frontend
```
