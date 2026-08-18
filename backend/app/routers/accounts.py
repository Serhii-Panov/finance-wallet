"""
Account router - CRUD operations for accounts.
"""
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from typing import List

from app.database import get_collection
from app.models.schemas import (
    Account,
    AccountCreate,
    AccountUpdate,
    AccountList,
    str_to_object_id
)

router = APIRouter(prefix="/accounts", tags=["accounts"])

COLLECTION_NAME = "accounts"

@router.post("/", response_model=Account, status_code=status.HTTP_201_CREATED)
async def create_account(account: AccountCreate):
    """Create a new account."""
    collection = get_collection(COLLECTION_NAME)
    
    # Check if account with same name exists
    existing = await collection.find_one({"name": account.name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account with name '{account.name}' already exists"
        )
    
    account_dict = account.model_dump()
    result = await collection.insert_one(account_dict)
    
    created_account = await collection.find_one({"_id": result.inserted_id})
    created_account["id"] = str(created_account.pop("_id"))
    
    return created_account

@router.get("/", response_model=AccountList)
async def list_accounts():
    """List all accounts."""
    collection = get_collection(COLLECTION_NAME)
    
    accounts = []
    async for doc in collection.find():
        doc["id"] = str(doc.pop("_id"))
        accounts.append(doc)
    
    return AccountList(items=accounts, total=len(accounts))

@router.get("/{account_id}", response_model=Account)
async def get_account(account_id: str):
    """Get an account by ID."""
    collection = get_collection(COLLECTION_NAME)
    
    try:
        oid = str_to_object_id(account_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account ID format"
        )
    
    account = await collection.find_one({"_id": oid})
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id '{account_id}' not found"
        )
    
    account["id"] = str(account.pop("_id"))
    return account

@router.put("/{account_id}", response_model=Account)
async def update_account(account_id: str, account_update: AccountUpdate):
    """Update an account."""
    collection = get_collection(COLLECTION_NAME)
    
    try:
        oid = str_to_object_id(account_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account ID format"
        )
    
    # Check if account exists
    existing = await collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id '{account_id}' not found"
        )
    
    # Build update data (only non-None fields)
    update_data = account_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Check for name conflict if updating name
    if "name" in update_data:
        name_conflict = await collection.find_one({
            "name": update_data["name"],
            "_id": {"$ne": oid}
        })
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Account with name '{update_data['name']}' already exists"
            )
    
    await collection.update_one({"_id": oid}, {"$set": update_data})
    
    updated_account = await collection.find_one({"_id": oid})
    updated_account["id"] = str(updated_account.pop("_id"))
    
    return updated_account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(account_id: str):
    """Delete an account."""
    collection = get_collection(COLLECTION_NAME)
    transactions_collection = get_collection("transactions")
    
    try:
        oid = str_to_object_id(account_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account ID format"
        )
    
    # Check if account exists
    existing = await collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id '{account_id}' not found"
        )
    
    # Check for associated transactions
    transaction_count = await transactions_collection.count_documents({"account_id": account_id})
    if transaction_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete account: {transaction_count} associated transactions exist"
        )
    
    await collection.delete_one({"_id": oid})
    return None