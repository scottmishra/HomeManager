from backend.core.supabase_client import get_supabase
from backend.models.home import HomeCreate, HomeUpdate


class HomeService:
    """Service layer for home CRUD operations. Agent-ready: all methods can be called
    directly by CrewAI tools or by API routes."""

    def __init__(self):
        self.supabase = get_supabase()
        self.table = "homes"

    def create_home(self, user_id: str, home: HomeCreate) -> dict:
        data = home.model_dump(exclude_none=True)
        data["user_id"] = user_id
        result = self.supabase.table(self.table).insert(data).execute()
        return result.data[0] if result.data else {}

    def get_home(self, home_id: str, user_id: str) -> dict | None:
        result = (
            self.supabase.table(self.table)
            .select("*")
            .eq("id", home_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def list_homes(self, user_id: str) -> list[dict]:
        result = (
            self.supabase.table(self.table)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    def update_home(self, home_id: str, user_id: str, home: HomeUpdate) -> dict | None:
        data = home.model_dump(exclude_none=True)
        if not data:
            return self.get_home(home_id, user_id)
        result = (
            self.supabase.table(self.table)
            .update(data)
            .eq("id", home_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def delete_home(self, home_id: str, user_id: str) -> bool:
        result = (
            self.supabase.table(self.table)
            .delete()
            .eq("id", home_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(result.data)
