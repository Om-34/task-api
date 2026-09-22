from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.database import Base, engine
from src.routers import auth, users, tasks

# Create tables if they don't exist yet. For production use, prefer a proper
# migration tool (e.g. Alembic) instead of create_all.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Manager API",
    description="A simple backend with JWT auth, roles, and task CRUD.",
    version="1.0.0",
)

# Allow the frontend (a separate origin, e.g. http://localhost:5173) to call
# this API from the browser. Origins are configurable via the CORS_ORIGINS
# env var (comma-separated) so this never needs a code change per environment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return clear, consistent error messages for invalid input (422)."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
        },
    )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok"}
