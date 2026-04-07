from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class TaskFrequency(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    BIANNUAL = "biannual"
    ANNUAL = "annual"
    AS_NEEDED = "as_needed"


class TaskStatus(str, Enum):
    PENDING = "pending"
    UPCOMING = "upcoming"
    OVERDUE = "overdue"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class MaintenanceTask(BaseModel):
    id: str | None = None
    home_id: str
    appliance_id: str | None = None
    title: str = Field(..., description="e.g. 'Flush Tankless Water Heater'")
    description: str | None = None
    frequency: TaskFrequency = TaskFrequency.ANNUAL
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    due_date: date | None = None
    completed_date: date | None = None
    estimated_duration_minutes: int | None = None
    estimated_cost: float | None = None
    how_to_guide_id: str | None = None
    is_ai_generated: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MaintenanceTaskCreate(BaseModel):
    home_id: str
    appliance_id: str | None = None
    title: str
    description: str | None = None
    frequency: TaskFrequency = TaskFrequency.ANNUAL
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: date | None = None
    estimated_duration_minutes: int | None = None
    estimated_cost: float | None = None


class MaintenanceTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    frequency: TaskFrequency | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    due_date: date | None = None
    completed_date: date | None = None
    estimated_duration_minutes: int | None = None
    estimated_cost: float | None = None


class MaintenanceLog(BaseModel):
    id: str | None = None
    task_id: str
    home_id: str
    completed_by: str | None = None
    completion_date: date
    notes: str | None = None
    cost: float | None = None
    contractor_name: str | None = None
    photos: list[str] | None = None
    created_at: datetime | None = None
