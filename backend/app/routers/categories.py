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
    # Expense categories (type: "expense")
    {"name": "Продукти", "type": CategoryType.EXPENSE, "icon": "shopping-cart", "color": "#EF4444"},
    {"name": "Транспорт", "type": CategoryType.EXPENSE, "icon": "bus", "color": "#F59E0B"},
    {"name": "Кафе та рестораны", "type": CategoryType.EXPENSE, "icon": "utensils", "color": "#10B981"},
    {"name": "Розваги", "type": CategoryType.EXPENSE, "icon": "gamepad-2", "color": "#8B5CF6"},
    {"name": "Житло", "type": CategoryType.EXPENSE, "icon": "home", "color": "#3B82F6"},
    {"name": "Здоров'я", "type": CategoryType.EXPENSE, "icon": "heart-pulse", "color": "#EC4899"},
    {"name": "Покупки", "type": CategoryType.EXPENSE, "icon": "shopping-bag", "color": "#6366F1"},
    # Income categories (type: "income")
    {"name": "Зарплата", "type": CategoryType.INCOME, "icon": "wallet", "color": "#10B981"},
    {"name": "Фріланс", "type": CategoryType.INCOME, "icon": "laptop", "color": "#3B82F6"},
    {"name": "Інвестиції", "type": CategoryType.INCOME, "icon": "trending-up", "color": "#8B5CF6"},
    {"name": "Подарунки", "type": CategoryType.INCOME, "icon": "gift", "color": "#EC4899"},
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
    created_category["id"] = str(created_category.pop("_id"))
    
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
        doc["id"] = str(doc.pop("_id"))
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
    
    category["id"] = str(category.pop("_id"))
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
    updated_category["id"] = str(updated_category.pop("_id"))
    
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
    Clears the collection and inserts all default categories.
    """
    collection = get_collection(COLLECTION_NAME)
    
    # Clear all existing categories
    await collection.delete_many({})
    
    # Insert all default categories
    created_categories = []
    for default_cat in DEFAULT_CATEGORIES:
        result = await collection.insert_one(default_cat.copy())
        created = await collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        created_categories.append(created)
    
    return CategoryList(items=created_categories, total=len(created_categories))
