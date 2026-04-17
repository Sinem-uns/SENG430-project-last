import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.routes import dataset, train, explain, bias, certificate

load_dotenv()

app = FastAPI(
    title="HEALTH-AI · ML Learning Tool",
    description="Backend API for the Erasmus+ KA220-HED Healthcare ML Education Platform",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://localhost:3000",
)
allowed_origins: list[str] = [o.strip() for o in raw_origins.split(",") if o.strip()]

# Always allow Vercel preview deployments
allowed_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# File-size limit middleware
# ---------------------------------------------------------------------------
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "50"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024


@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_UPLOAD_BYTES:
        return JSONResponse(
            status_code=413,
            content={"detail": f"Request body exceeds {MAX_UPLOAD_MB} MB limit."},
        )
    return await call_next(request)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(dataset.router, prefix="/api")
app.include_router(train.router, prefix="/api")
app.include_router(explain.router, prefix="/api")
app.include_router(bias.router, prefix="/api")
app.include_router(certificate.router, prefix="/api")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "HEALTH-AI ML Learning Tool"}
