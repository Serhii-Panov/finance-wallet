from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_to_mongo, close_mongo_connection, get_collection
from app.routers import accounts, categories, transactions

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to MongoDB
    await connect_to_mongo()
    
    # Auto-initialize default categories if collection is empty
    category_collection = get_collection("categories")
    count = await category_collection.count_documents({})
    if count == 0:
        for default_cat in categories.DEFAULT_CATEGORIES:
            await category_collection.insert_one(default_cat.copy())
    
    yield
    # Shutdown: close MongoDB connection
    await close_mongo_connection()

app = FastAPI(
    title="Finance Wallet API",
    description="Personal finance wallet backend",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Finance Wallet API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers with /api prefix
app.include_router(accounts.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
