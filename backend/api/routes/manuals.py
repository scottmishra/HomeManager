from fastapi import APIRouter, Depends

from backend.core.auth import get_current_user
from backend.models.manual import ManualSearchRequest, ManualSearchResponse
from backend.services.manual_search_service import ManualSearchService

router = APIRouter(prefix="/manuals", tags=["manuals"])


@router.post("/search", response_model=ManualSearchResponse)
async def search_manuals(
    request: ManualSearchRequest,
    user=Depends(get_current_user),
):
    service = ManualSearchService()
    return await service.search_manuals(request.appliance_id, user.id, request.query_override)
