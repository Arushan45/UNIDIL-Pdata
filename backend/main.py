from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Dict, Any
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json

app = FastAPI()

# Enable CORS so React (Port 3000) can talk to FastAPI (Port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection settings
DB_SETTINGS = {
    "dbname": os.getenv("DB_NAME", "factory_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5433"),
}

def get_db_connection():
    return psycopg2.connect(**DB_SETTINGS)

# Define the expected format of incoming data
class ProductionData(BaseModel):
    plant_id: int
    metrics: Dict[str, Any]

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

@app.get("/schema/{plant_id}")
def get_schema(plant_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT form_schema FROM plant_schemas WHERE plant_id = %s;", (plant_id,))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result is None:
            raise HTTPException(status_code=404, detail="Plant not found")
            
        return result["form_schema"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/data/submit")
def submit_data(data: ProductionData):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Save the dynamic JSON data to PostgreSQL
        cur.execute(
            "INSERT INTO production_data (plant_id, metrics) VALUES (%s, %s);",
            (data.plant_id, json.dumps(data.metrics))
        )
        conn.commit() # Don't forget to commit!
        
        cur.close()
        conn.close()
        return {"status": "success", "message": "Data securely saved to PostgreSQL"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
