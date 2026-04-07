from fastapi import APIRouter, Depends, HTTPException

from backend.core.auth import get_current_user
from backend.models.maintenance import MaintenanceTaskCreate, MaintenanceTaskUpdate
from backend.services.maintenance_service import MaintenanceService

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


def get_maintenance_service() -> MaintenanceService:
    return MaintenanceService()


@router.post("/tasks", status_code=201)
async def create_task(
    task: MaintenanceTaskCreate,
    user=Depends(get_current_user),
    service: MaintenanceService = Depends(get_maintenance_service),
):
    return service.create_task(user.id, task)


@router.get("/tasks/home/{home_id}")
async def list_tasks(
    home_id: str,
    status: str | None = None,
    user=Depends(get_current_user),
    service: MaintenanceService = Depends(get_maintenance_service),
):
    return service.list_tasks(home_id, user.id, status=status)


@router.get("/tasks/upcoming")
async def upcoming_tasks(
    days: int = 7,
    user=Depends(get_current_user),
    service: MaintenanceService = Depends(get_maintenance_service),
):
    return service.get_upcoming_tasks(user.id, days)


@router.get("/tasks/{task_id}")
async def get_task(
    task_id: str,
    user=Depends(get_current_user),
    service: MaintenanceService = Depends(get_maintenance_service),
):
    task = service.get_task(task_id, user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/tasks/{task_id}")
async def update_task(
    task_id: str,
    task: MaintenanceTaskUpdate,
    user=Depends(get_current_user),
    service: MaintenanceService = Depends(get_maintenance_service),
):
    result = service.update_task(task_id, user.id, task)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    return result


@router.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    notes: str | None = None,
    user=Depends(get_current_user),
    service: MaintenanceService = Depends(get_maintenance_service),
):
    result = service.complete_task(task_id, user.id, notes)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    return result


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    user=Depends(get_current_user),
    service: MaintenanceService = Depends(get_maintenance_service),
):
    if not service.delete_task(task_id, user.id):
        raise HTTPException(status_code=404, detail="Task not found")
