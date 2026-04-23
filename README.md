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

Create a local `.env` from the example and fill in your PostgreSQL password:

```powershell
Copy-Item .env.example .env
```

Run the API:

```powershell
cd backend
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
