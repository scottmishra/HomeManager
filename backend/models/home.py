from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class HomeType(str, Enum):
    SINGLE_FAMILY = "single_family"
    TOWNHOUSE = "townhouse"
    CONDO = "condo"
    MULTI_FAMILY = "multi_family"
    MOBILE = "mobile"


class Home(BaseModel):
    id: str | None = None
    user_id: str | None = None
    name: str = Field(..., description="Friendly name for the home, e.g. 'Main House'")
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    home_type: HomeType = HomeType.SINGLE_FAMILY
    year_built: int | None = None
    square_footage: int | None = None
    builder: str | None = None
    num_bedrooms: int | None = None
    num_bathrooms: float | None = None
    climate_zone: str | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class HomeCreate(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    home_type: HomeType = HomeType.SINGLE_FAMILY
    year_built: int | None = None
    square_footage: int | None = None
    builder: str | None = None
    num_bedrooms: int | None = None
    num_bathrooms: float | None = None
    notes: str | None = None


class HomeUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    home_type: HomeType | None = None
    year_built: int | None = None
    square_footage: int | None = None
    builder: str | None = None
    num_bedrooms: int | None = None
    num_bathrooms: float | None = None
    notes: str | None = None
