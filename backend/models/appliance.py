from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class ApplianceCategory(str, Enum):
    HVAC = "hvac"
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    KITCHEN = "kitchen"
    LAUNDRY = "laundry"
    OUTDOOR = "outdoor"
    STRUCTURAL = "structural"
    SAFETY = "safety"
    OTHER = "other"


class Appliance(BaseModel):
    id: str | None = None
    home_id: str
    name: str = Field(..., description="e.g. 'Tankless Water Heater'")
    brand: str | None = None
    model_number: str | None = None
    serial_number: str | None = None
    category: ApplianceCategory = ApplianceCategory.OTHER
    purchase_date: date | None = None
    warranty_expiry: date | None = None
    install_date: date | None = None
    location_in_home: str | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ApplianceCreate(BaseModel):
    home_id: str
    name: str
    brand: str | None = None
    model_number: str | None = None
    serial_number: str | None = None
    category: ApplianceCategory = ApplianceCategory.OTHER
    purchase_date: date | None = None
    warranty_expiry: date | None = None
    install_date: date | None = None
    location_in_home: str | None = None
    notes: str | None = None


class ApplianceUpdate(BaseModel):
    name: str | None = None
    brand: str | None = None
    model_number: str | None = None
    serial_number: str | None = None
    category: ApplianceCategory | None = None
    purchase_date: date | None = None
    warranty_expiry: date | None = None
    install_date: date | None = None
    location_in_home: str | None = None
    notes: str | None = None
