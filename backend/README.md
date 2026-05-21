# ZIPPO FastAPI Backend (MVC)

FastAPI backend for ZIPPO that uses a clean MVC-style architecture while
keeping algorithm logic in the original four modules.

## Architecture

- `zippo_api/models`: request/response schemas (Pydantic models)
- `zippo_api/controllers`: route handlers (HTTP layer)
- `zippo_api/services`: orchestration/business layer
- `zippo_api/repositories`: data access layer (Supabase schema operations)
- `zippo_api/core`: app settings/constants
- `zippo_api/main.py`: app factory/bootstrap
- `app.py`: compatibility entrypoint (`uvicorn app:app`)

The algorithm modules remain unchanged and are reused by services:

- `gift_intelligence.py`
- `recommendations.py`
- `delivery_optimizer.py`
- `baseline.py`

## Conda Setup (Required)

```powershell
cd backend
conda env create -f environment.yml
conda activate zippo-backend
```

## Configure Environment Variables

PowerShell:

```powershell
$env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
$env:SUPABASE_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
```

Bash:

```bash
export SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
export SUPABASE_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
```

## Run API

```powershell
uvicorn app:app --reload --port 8000
```

Frontend must point to this API base URL:

- `VITE_PYTHON_API_BASE_URL=http://localhost:8000`

## Endpoints

- `GET /health`
- `POST /api/gift-intelligence/filter`
- `POST /api/auth/signin`
- `POST /api/auth/signup`
- `GET /api/auth/session`
- `POST /api/auth/signout`
- `POST /api/recommendations/cbf`
- `POST /api/delivery/optimize`
- `POST /api/baseline/run`
- `POST /api/catalog/search`
- `POST /api/buyer/profile`
- `DELETE /api/buyer/profile/{user_id}`
- `POST /api/buyer/orders`
- `POST /api/reports/fraud`
- `POST /api/store-owner/apply`
- `POST /api/store-owner/stores`
- `PUT /api/store-owner/stores/{store_id}`
- `DELETE /api/store-owner/stores/{store_id}`
- `POST /api/store-owner/products`
- `PUT /api/store-owner/products/{product_id}`
- `DELETE /api/store-owner/products/{product_id}`
- `GET /api/driver/{driver_user_id}/tasks`
- `PATCH /api/driver/tasks/{task_id}`
- `GET /api/admin/dashboard`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/{report_id}`
