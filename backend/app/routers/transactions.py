"""
Transaction router - CRUD operations with automatic balance update.
"""
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import Optional

from app.database import get_collection
from app.models.schemas import (
    Transaction,
    TransactionCreate,
    TransactionUpdate,
    TransactionList,
    CategoryType,
    str_to_object_id
)

router = APIRouter(prefix="/transactions", tags=["transactions"])

COLLECTION_NAME = "transactions"

async def get_category_type(category_id: str) -> CategoryType:
    """Get category type by ID."""
    collection = get_collection("categories")
    
    try:
        oid = str_to_object_id(category_id)
    except ValueError:
        return None
    
    category = await collection.find_one({"_id": oid})
    if not category:
        return None
    
    return CategoryType(category["type"])

async def update_account_balance(account_id: str, amount: float, category_type: CategoryType):
    """
    Update account balance based on transaction.
    Income: increase balance
    Expense: decrease balance
    """
    accounts_collection = get_collection("accounts")
    
    try:
        oid = str_to_object_id(account_id)
    except ValueError:
        raise ValueError(f"Invalid account ID: {account_id}")
    
    if category_type == CategoryType.INCOME:
        # Increase balance for income
        await accounts_collection.update_one(
            {"_id": oid},
            {"$inc": {"balance": amount}}
        )
    else:
        # Decrease balance for expense
        await accounts_collection.update_one(
            {"_id": oid},
            {"$inc": {"balance": -amount}}
        )

async def reverse_account_balance(account_id: str, amount: float, category_type: CategoryType):
    """
    Reverse account balance change (used when updating/deleting transactions).
    Income: decrease balance
    Expense: increase balance
    """
    accounts_collection = get_collection("accounts")
    
    try:
        oid = str_to_object_id(account_id)
    except ValueError:
        raise ValueError(f"Invalid account ID: {account_id}")
    
    if category_type == CategoryType.INCOME:
        # Reverse income: decrease balance
        await accounts_collection.update_one(
            {"_id": oid},
            {"$inc": {"balance": -amount}}
        )
    else:
        # Reverse expense: increase balance
        await accounts_collection.update_one(
            {"_id": oid},
            {"$inc": {"balance": amount}}
        )

@router.post("/", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(transaction: TransactionCreate):
    """Create a new transaction and update account balance."""
    transactions_collection = get_collection(COLLECTION_NAME)
    accounts_collection = get_collection("accounts")
    categories_collection = get_collection("categories")
    
    # Validate account exists
    try:
        account_oid = str_to_object_id(transaction.account_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account ID format"
        )
    
    account = await accounts_collection.find_one({"_id": account_oid})
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id '{transaction.account_id}' not found"
        )
    
    # Validate category exists and get type
    try:
        category_oid = str_to_object_id(transaction.category_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID format"
        )
    
    category = await categories_collection.find_one({"_id": category_oid})
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id '{transaction.category_id}' not found"
        )
    
    category_type = CategoryType(category["type"])
    
    # Create transaction
    transaction_dict = transaction.model_dump()
    transaction_dict["currency"] = transaction.currency.value
    
    result = await transactions_collection.insert_one(transaction_dict)
    
    # Update account balance
    await update_account_balance(transaction.account_id, transaction.amount, category_type)
    
    created_transaction = await transactions_collection.find_one({"_id": result.inserted_id})
    created_transaction["id"] = str(created_transaction.pop("_id"))
    
    return created_transaction

@router.get("/", response_model=TransactionList)
async def list_transactions(
    account_id: Optional[str] = None,
    category_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    skip: int = 0
):
    """List transactions with optional filters."""
    collection = get_collection(COLLECTION_NAME)
    
    query = {}
    
    if account_id:
        query["account_id"] = account_id
    
    if category_id:
        query["category_id"] = category_id
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["date"] = date_query
    
    # Get total count
    total = await collection.count_documents(query)
    
    # Get paginated results sorted by date descending
    transactions = []
    async for doc in collection.find(query).sort("date", -1).skip(skip).limit(limit):
        doc["id"] = str(doc.pop("_id"))
        transactions.append(doc)
    
    return TransactionList(items=transactions, total=total)

@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    """Get a transaction by ID."""
    collection = get_collection(COLLECTION_NAME)
    
    try:
        oid = str_to_object_id(transaction_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format"
        )
    
    transaction = await collection.find_one({"_id": oid})
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id '{transaction_id}' not found"
        )
    
    transaction["id"] = str(transaction.pop("_id"))
    return transaction

@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, transaction_update: TransactionUpdate):
    """Update a transaction and adjust account balance accordingly."""
    transactions_collection = get_collection(COLLECTION_NAME)
    
    try:
        oid = str_to_object_id(transaction_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format"
        )
    
    # Get existing transaction
    existing = await transactions_collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id '{transaction_id}' not found"
        )
    
    # Build update data (only non-None fields)
    update_data = transaction_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Get original category type for balance reversal
    original_category_type = await get_category_type(existing["category_id"])
    
    # Check if amount or category is being changed
    amount_changed = "amount" in update_data and update_data["amount"] != existing["amount"]
    category_changed = "category_id" in update_data and update_data["category_id"] != existing["category_id"]
    account_changed = "account_id" in update_data and update_data["account_id"] != existing["account_id"]
    
    # Handle balance adjustments
    if amount_changed or category_changed or account_changed:
        # Reverse the original transaction effect
        await reverse_account_balance(
            existing["account_id"],
            existing["amount"],
            original_category_type
        )
        
        # Determine new values
        new_account_id = update_data.get("account_id", existing["account_id"])
        new_amount = update_data.get("amount", existing["amount"])
        new_category_id = update_data.get("category_id", existing["category_id"])
        
        # Get new category type
        new_category_type = await get_category_type(new_category_id)
        if not new_category_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with id '{new_category_id}' not found"
            )
        
        # Validate the new account for expense transactions
        if new_category_type == CategoryType.EXPENSE:
            accounts_collection = get_collection("accounts")
            try:
                account_oid = str_to_object_id(new_account_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid account ID format"
                )
            
            account = await accounts_collection.find_one({"_id": account_oid})
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Account with id '{new_account_id}' not found"
                )
            
        # Apply new transaction effect
        await update_account_balance(new_account_id, new_amount, new_category_type)
    
    # Convert currency enum if present
    if "currency" in update_data and update_data["currency"]:
        update_data["currency"] = update_data["currency"].value
    
    # Update transaction
    await transactions_collection.update_one({"_id": oid}, {"$set": update_data})
    
    updated_transaction = await transactions_collection.find_one({"_id": oid})
    updated_transaction["id"] = str(updated_transaction.pop("_id"))
    
    return updated_transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(transaction_id: str):
    """Delete a transaction and reverse account balance change."""
    transactions_collection = get_collection(COLLECTION_NAME)
    
    try:
        oid = str_to_object_id(transaction_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format"
        )
    
    # Get existing transaction
    existing = await transactions_collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id '{transaction_id}' not found"
        )
    
    # Get category type
    category_type = await get_category_type(existing["category_id"])
    
    # Reverse the balance effect
    if category_type:
        await reverse_account_balance(
            existing["account_id"],
            existing["amount"],
            category_type
        )
    
    # Delete transaction
    await transactions_collection.delete_one({"_id": oid})
    
    return None