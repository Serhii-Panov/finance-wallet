"""
Category router - CRUD operations for categories and default category initialization.
"""
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from typing import List

from app.database import get_collection
from app.models.schemas import (
    Category,
    CategoryCreate,
    CategoryUpdate,
    CategoryList,
    CategoryType,
    str_to_object_id
)

router = APIRouter(prefix="/categories", tags=["categories"])

COLLECTION_NAME = "categories"

# Default categories for new users
DEFAULT_CATEGORIES = [
    # Expense categories
    {"name": "Продукти", "type": CategoryType.EXPENSE, "icon": "shopping-cart", "color": "#4CAF50"},
    {"name": "Кафе", "type": CategoryType.EXPENSE, "icon": "coffee", "color": "#795548"},
    {"name": "Транспорт", "type": CategoryType.EXPENSE, "icon": "car", "color": "#2196F3"},
    {"name": "Розваги", "type": CategoryType.EXPENSE, "icon": "gamepad-2", "color": "#9C27B0"},
    {"name": "Здоров'я", "type": CategoryType.EXPENSE, "icon": "heart-pulse", "color": "#E91E63"},
    {"name": "Одяг", "type": CategoryType.EXPENSE, "icon": "shirt", "color": "#FF5722"},
    {"name": "Зв'язок", "type": CategoryType.EXPENSE, "icon": "phone", "color": "#00BCD4"},
    {"name": "Побут", "type": CategoryType.EXPENSE, "icon": "home", "color": "#607D8B"},
    {"name": "Освіта", "type": CategoryType.EXPENSE, "icon": "book-open", "color": "#3F51B5"},
    {"name": "Подарунки", "type": CategoryType.EXPENSE, "icon": "gift", "color": "#FF9800"},
    {"name": "Інші витрати", "type": CategoryType.EXPENSE, "icon": "more-horizontal", "color": "#9E9E9E"},
    # Income categories
    {"name": "Зарплата", "type": CategoryType.INCOME, "icon": "briefcase", "color": "#4CAF50"},
    {"name": "Фріланс", "type": CategoryType.INCOME, "icon": "laptop", "color": "#2196F3"},
    {"name": "Подарунок", "type": CategoryType.INCOME, "icon": "gift", "color": "#E91E63"},
    {"name": "Інвестиції", "type": CategoryType.INCOME, "icon": "trending-up", "color": "#FF9800"},
    {"name": "Інші надходження", "type": CategoryType.INCOME, "icon": "plus-circle", "color": "#9E9E9E"},
]

@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate):
    """Create a new category."""
    collection = get_collection(COLLECTION_NAME)
    
    # Check if category with same name exists
    existing = await collection.find_one({"name": category.name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with name '{category.name}' already exists"
        )
    
    category_dict = category.model_dump()
    # Convert enum to string for MongoDB
    category_dict["type"] = category.type.value
    
    result = await collection.insert_one(category_dict)
    
    created_category = await collection.find_one({"_id": result.inserted_id})
    created_category["_id"] = str(created_category["_id"])
    
    return created_category

@router.get("/", response_model=CategoryList)
async def list_categories(type: CategoryType = None):
    """List all categories, optionally filtered by type."""
    collection = get_collection(COLLECTION_NAME)
    
    query = {}
    if type:
        query["type"] = type.value
    
    categories = []
    async for doc in collection.find(query):
        doc["_id"] = str(doc["_id"])
        categories.append(doc)
    
    return CategoryList(items=categories, total=len(categories))

@router.get("/{category_id}", response_model=Category)
async def get_category(category_id: str):
    """Get a category by ID."""
    collection = get_collection(COLLECTION_NAME)
    
    try:
        oid = str_to_object_id(category_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID format"
        )
    
    category = await collection.find_one({"_id": oid})
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id '{category_id}' not found"
        )
    
    category["_id"] = str(category["_id"])
    return category

@router.put("/{category_id}", response_model=Category)
async def update_category(category_id: str, category_update: CategoryUpdate):
    """Update a category."""
    collection = get_collection(COLLECTION_NAME)
    
    try:
        oid = str_to_object_id(category_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID format"
        )
    
    # Check if category exists
    existing = await collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id '{category_id}' not found"
        )
    
    # Build update data (only non-None fields)
    update_data = category_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Convert enum to string if present
    if "type" in update_data and update_data["type"]:
        update_data["type"] = update_data["type"].value
    
    # Check for name conflict if updating name
    if "name" in update_data:
        name_conflict = await collection.find_one({
            "name": update_data["name"],
            "_id": {"$ne": oid}
        })
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with name '{update_data['name']}' already exists"
            )
    
    await collection.update_one({"_id": oid}, {"$set": update_data})
    
    updated_category = await collection.find_one({"_id": oid})
    updated_category["_id"] = str(updated_category["_id"])
    
    return updated_category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: str):
    """Delete a category."""
    collection = get_collection(COLLECTION_NAME)
    transactions_collection = get_collection("transactions")
    
    try:
        oid = str_to_object_id(category_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID format"
        )
    
    # Check if category exists
    existing = await collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id '{category_id}' not found"
        )
    
    # Check for associated transactions
    transaction_count = await transactions_collection.count_documents({"category_id": category_id})
    if transaction_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category: {transaction_count} associated transactions exist"
        )
    
    await collection.delete_one({"_id": oid})
    return None

@router.post("/init-defaults", response_model=CategoryList, status_code=status.HTTP_201_CREATED)
async def initialize_default_categories():
    """
    Initialize default categories for a new user.
    Only creates categories that don't already exist.
    """
    collection = get_collection(COLLECTION_NAME)
    
    created_categories = []
    
    for default_cat in DEFAULT_CATEGORIES:
        # Check if category already exists
        existing = await collection.find_one({"name": default_cat["name"]})
        if existing:
            continue
        
        # Create category
        result = await collection.insert_one(default_cat.copy())
        created = await collection.find_one({"_id": result.inserted_id})
        created["_id"] = str(created["_id"])
        created_categories.append(created)
    
    # Get all categories (including pre-existing ones)
    all_categories = []
    async for doc in collection.find():
        doc["_id"] = str(doc["_id"])
        all_categories.append(doc)
    
    return CategoryList(items=all_categories, total=len(all_categories))