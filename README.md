# Pdata_sample

Simple factory production data app with:

- FastAPI backend
- React-based frontend
- PostgreSQL for dynamic schemas and production data

## Backend

Create and activate a virtual environment, then install dependencies:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn psycopg2-binary
```

Set database environment variables:

```powershell
$env:DB_NAME="factory_db"
$env:DB_USER="postgres"
$env:DB_PASSWORD="your_password"
$env:DB_HOST="localhost"
$env:DB_PORT="5433"
```

Run the API:

```powershell
uvicorn main:app --host 127.0.0.1 --port 8001
```

## Frontend

Serve the frontend folder on port 3000:

```powershell
cd frontend
python -m http.server 3000 --bind 127.0.0.1
```

Then open:

`http://127.0.0.1:3000/`
