"""
Pydantic v2 schemas for Finance Wallet API.
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId

class ObjectType(str, Enum):
    """Helper for MongoDB ObjectId validation."""
    OBJECT_ID = "objectId"

class AccountType(str, Enum):
    """Account types."""
    CASH = "cash"
    CARD = "card"
    SAVINGS = "savings"

class Currency(str, Enum):
    """Supported currencies."""
    UAH = "UAH"
    USD = "USD"

class CategoryType(str, Enum):
    """Category types."""
    INCOME = "income"
    EXPENSE = "expense"

class PyObjectId(str):
    """Custom type for MongoDB ObjectId."""
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.with_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.plain_serializer_function_ser_schema(str)
        )

    @classmethod
    def validate(cls, v, info):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

# Base schemas
class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# Account schemas
class AccountBase(BaseSchema):
    """Base account schema."""
    name: str = Field(..., min_length=1, max_length=100, description="Account name")
    type: AccountType = Field(default=AccountType.CARD, description="Account type")
    currency: Currency = Field(default=Currency.UAH, description="Account currency")
    balance: float = Field(default=0.0, ge=0, description="Current balance")

class AccountCreate(AccountBase):
    """Schema for creating an account."""
    pass

class AccountUpdate(BaseSchema):
    """Schema for updating an account."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[AccountType] = None
    currency: Optional[Currency] = None
    balance: Optional[float] = Field(None, ge=0)

class AccountInDB(AccountBase):
    """Schema for account in database."""
    id: str = Field(..., alias="_id", description="Account ID")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        from_attributes=True
    )

class Account(AccountInDB):
    """Public account schema."""
    pass

# Category schemas
class CategoryBase(BaseSchema):
    """Base category schema."""
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    type: CategoryType = Field(..., description="Category type")
    icon: Optional[str] = Field(None, max_length=50, description="Icon name")
    color: Optional[str] = Field(None, max_length=20, description="Color hex code")

class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    pass

class CategoryUpdate(BaseSchema):
    """Schema for updating a category."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[CategoryType] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)

class CategoryInDB(CategoryBase):
    """Schema for category in database."""
    id: str = Field(..., alias="_id", description="Category ID")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        from_attributes=True
    )

class Category(CategoryInDB):
    """Public category schema."""
    pass

# Transaction schemas
class TransactionBase(BaseSchema):
    """Base transaction schema."""
    account_id: str = Field(..., description="Account ID")
    category_id: str = Field(..., description="Category ID")
    amount: float = Field(..., gt=0, description="Transaction amount (always positive)")
    currency: Currency = Field(default=Currency.UAH, description="Transaction currency")
    rate_to_base: Optional[float] = Field(None, gt=0, description="Exchange rate to base currency (UAH)")
    date: datetime = Field(default_factory=datetime.utcnow, description="Transaction date")
    note: Optional[str] = Field(None, max_length=500, description="Transaction note")

class TransactionCreate(TransactionBase):
    """Schema for creating a transaction."""
    pass

class TransactionUpdate(BaseSchema):
    """Schema for updating a transaction."""
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[Currency] = None
    rate_to_base: Optional[float] = Field(None, gt=0)
    date: Optional[datetime] = None
    note: Optional[str] = Field(None, max_length=500)

class TransactionInDB(TransactionBase):
    """Schema for transaction in database."""
    id: str = Field(..., alias="_id", description="Transaction ID")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        from_attributes=True
    )

class Transaction(TransactionInDB):
    """Public transaction schema."""
    pass

# Response schemas
class AccountList(BaseSchema):
    """List of accounts."""
    items: list[Account]
    total: int

class CategoryList(BaseSchema):
    """List of categories."""
    items: list[Category]
    total: int

class TransactionList(BaseSchema):
    """List of transactions."""
    items: list[Transaction]
    total: int

# Helper functions
def str_to_object_id(id_str: str) -> ObjectId:
    """Convert string to ObjectId."""
    if not ObjectId.is_valid(id_str):
        raise ValueError(f"Invalid ObjectId: {id_str}")
    return ObjectId(id_str)