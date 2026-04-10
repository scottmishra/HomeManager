from urllib.parse import urlparse

import httpx
from fastapi import HTTPException

from backend.core.config import settings
from backend.core.supabase_client import get_supabase
from backend.models.manual import ManualResult, ManualSearchResponse


class ManualSearchService:
    def __init__(self):
        self.supabase = get_supabase()

    async def search_manuals(
        self,
        appliance_id: str,
        user_id: str,
        query_override: str | None = None,
    ) -> ManualSearchResponse:
        if not settings.brave_search_api_key:
            raise HTTPException(
                status_code=503,
                detail="Manual search is not configured. Please upload your manual directly.",
            )

        # Fetch appliance (verifies ownership)
        result = (
            self.supabase.table("appliances")
            .select("*")
            .eq("id", appliance_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Appliance not found.")

        appliance = result.data[0]
        name = appliance.get("name", "")
        brand = appliance.get("brand") or ""
        model = appliance.get("model_number") or ""

        if query_override:
            query = query_override
        else:
            parts = [p for p in [brand, model, name, "user manual filetype:pdf"] if p]
            if not parts:
                return ManualSearchResponse(results=[], query_used="", appliance_name=name)
            query = " ".join(parts)

        appliance_name = " ".join(p for p in [brand, model] if p) or name

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.search.brave.com/res/v1/web/search",
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip",
                        "X-Subscription-Token": settings.brave_search_api_key,
                    },
                    params={
                        "q": query,
                        "count": settings.brave_search_results_count,
                        "result_filter": "web",
                    },
                )
                response.raise_for_status()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Manual search timed out.")
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (401, 403):
                raise HTTPException(status_code=503, detail="Search API key invalid.")
            raise HTTPException(status_code=502, detail="Search service error.")

        data = response.json()
        web_results = data.get("web", {}).get("results", [])

        results = []
        for item in web_results:
            url = item.get("url", "")
            is_pdf = url.lower().endswith(".pdf")
            parsed = urlparse(url)
            domain = parsed.netloc.removeprefix("www.")
            results.append(
                ManualResult(
                    title=item.get("title", ""),
                    url=url,
                    description=item.get("description", ""),
                    is_pdf=is_pdf,
                    source_domain=domain,
                )
            )

        return ManualSearchResponse(
            results=results,
            query_used=query,
            appliance_name=appliance_name,
        )
