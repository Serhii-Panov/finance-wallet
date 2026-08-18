from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file before creating Settings
load_dotenv()

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name: str = "finance_wallet"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Global database client and database reference
client: Optional[AsyncIOMotorClient] = None
database = None

async def connect_to_mongo() -> None:
    """Create database connection pool."""
    global client, database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.database_name]

async def close_mongo_connection() -> None:
    """Close database connection pool."""
    global client
    if client:
        client.close()

def get_database():
    """Get database instance."""
    return database

def get_collection(collection_name: str):
    """Get a specific collection from the database."""
    return database[collection_name]