from pydantic import BaseModel


class ManualSearchRequest(BaseModel):
    appliance_id: str
    query_override: str | None = None


class ManualResult(BaseModel):
    title: str
    url: str
    description: str
    is_pdf: bool
    source_domain: str


class ManualSearchResponse(BaseModel):
    results: list[ManualResult]
    query_used: str
    appliance_name: str
