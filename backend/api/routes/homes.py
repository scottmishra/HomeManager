from fastapi import APIRouter, Depends, HTTPException

from backend.core.auth import get_current_user
from backend.models.home import HomeCreate, HomeUpdate
from backend.services.home_service import HomeService

router = APIRouter(prefix="/homes", tags=["homes"])


def get_home_service() -> HomeService:
    return HomeService()


@router.post("/", status_code=201)
async def create_home(
    home: HomeCreate,
    user=Depends(get_current_user),
    service: HomeService = Depends(get_home_service),
):
    return service.create_home(user.id, home)


@router.get("/")
async def list_homes(
    user=Depends(get_current_user),
    service: HomeService = Depends(get_home_service),
):
    return service.list_homes(user.id)


@router.get("/{home_id}")
async def get_home(
    home_id: str,
    user=Depends(get_current_user),
    service: HomeService = Depends(get_home_service),
):
    home = service.get_home(home_id, user.id)
    if not home:
        raise HTTPException(status_code=404, detail="Home not found")
    return home


@router.patch("/{home_id}")
async def update_home(
    home_id: str,
    home: HomeUpdate,
    user=Depends(get_current_user),
    service: HomeService = Depends(get_home_service),
):
    result = service.update_home(home_id, user.id, home)
    if not result:
        raise HTTPException(status_code=404, detail="Home not found")
    return result


@router.delete("/{home_id}", status_code=204)
async def delete_home(
    home_id: str,
    user=Depends(get_current_user),
    service: HomeService = Depends(get_home_service),
):
    if not service.delete_home(home_id, user.id):
        raise HTTPException(status_code=404, detail="Home not found")
