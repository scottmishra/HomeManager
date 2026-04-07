from fastapi import APIRouter, Depends, HTTPException

from backend.core.auth import get_current_user
from backend.models.appliance import ApplianceCreate, ApplianceUpdate
from backend.services.appliance_service import ApplianceService

router = APIRouter(prefix="/appliances", tags=["appliances"])


def get_appliance_service() -> ApplianceService:
    return ApplianceService()


@router.post("/", status_code=201)
async def create_appliance(
    appliance: ApplianceCreate,
    user=Depends(get_current_user),
    service: ApplianceService = Depends(get_appliance_service),
):
    return service.create_appliance(user.id, appliance)


@router.get("/home/{home_id}")
async def list_appliances(
    home_id: str,
    user=Depends(get_current_user),
    service: ApplianceService = Depends(get_appliance_service),
):
    return service.list_appliances(home_id, user.id)


@router.get("/{appliance_id}")
async def get_appliance(
    appliance_id: str,
    user=Depends(get_current_user),
    service: ApplianceService = Depends(get_appliance_service),
):
    appliance = service.get_appliance(appliance_id, user.id)
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    return appliance


@router.patch("/{appliance_id}")
async def update_appliance(
    appliance_id: str,
    appliance: ApplianceUpdate,
    user=Depends(get_current_user),
    service: ApplianceService = Depends(get_appliance_service),
):
    result = service.update_appliance(appliance_id, user.id, appliance)
    if not result:
        raise HTTPException(status_code=404, detail="Appliance not found")
    return result


@router.delete("/{appliance_id}", status_code=204)
async def delete_appliance(
    appliance_id: str,
    user=Depends(get_current_user),
    service: ApplianceService = Depends(get_appliance_service),
):
    if not service.delete_appliance(appliance_id, user.id):
        raise HTTPException(status_code=404, detail="Appliance not found")
