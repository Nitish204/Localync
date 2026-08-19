from dotenv import load_dotenv
load_dotenv()  # must run before the app modules below, since security.py
                # reads LOCALYNC_SECRET_KEY at import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import auth, products, cart, vendor, technician, admin, advisor_routes
from .seed import run as seed_run

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Localync API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(vendor.router)
app.include_router(technician.router)
app.include_router(admin.router)
app.include_router(advisor_routes.router)


@app.on_event("startup")
def on_startup():
    seed_run()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "localync-api"}
