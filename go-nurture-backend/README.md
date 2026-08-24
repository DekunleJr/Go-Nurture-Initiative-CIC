# Go Nurture Backend

FastAPI backend for the Go Nurture Initiative CIC platform.

## Local setup

From this directory:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `DATABASE_URL` and a strong `SECRET_KEY` in `.env`, then run migrations:

```powershell
alembic upgrade head
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`. Interactive API documentation is available at `/docs`.

## Structure

- `app/main.py`: FastAPI application, middleware, exception handlers, and startup tasks
- `app/routers/`: HTTP endpoints
- `app/models/`: SQLAlchemy models
- `app/schemas/`: Pydantic request and response schemas
- `app/services/`: Email, geocoding, and other application services
- `app/database/`: SQLAlchemy engine and session setup
- `alembic/versions/`: Database migrations

## Configuration

Use [.env.example](.env.example) as the source of documented backend variables. Never commit a real `.env` file or production secrets.

## Production

The included [Dockerfile](Dockerfile) runs `alembic upgrade head` before starting Uvicorn. See the repository [DEPLOYMENT.md](../DEPLOYMENT.md) for the production checklist.
