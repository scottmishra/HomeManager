from backend.core.supabase_client import get_supabase
from backend.models.appliance import ApplianceCreate, ApplianceUpdate


class ApplianceService:
    """Service layer for appliance CRUD. Agent-ready."""

    def __init__(self):
        self.supabase = get_supabase()
        self.table = "appliances"

    def create_appliance(self, user_id: str, appliance: ApplianceCreate) -> dict:
        data = appliance.model_dump(exclude_none=True)
        data["user_id"] = user_id
        # Serialize date fields to ISO strings for JSON
        for key in ("purchase_date", "warranty_expiry", "install_date"):
            if key in data and data[key] is not None:
                data[key] = str(data[key])
        result = self.supabase.table(self.table).insert(data).execute()
        return result.data[0] if result.data else {}

    def get_appliance(self, appliance_id: str, user_id: str) -> dict | None:
        result = (
            self.supabase.table(self.table)
            .select("*")
            .eq("id", appliance_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def list_appliances(self, home_id: str, user_id: str) -> list[dict]:
        result = (
            self.supabase.table(self.table)
            .select("*")
            .eq("home_id", home_id)
            .eq("user_id", user_id)
            .order("category")
            .execute()
        )
        return result.data or []

    def update_appliance(
        self, appliance_id: str, user_id: str, appliance: ApplianceUpdate
    ) -> dict | None:
        data = appliance.model_dump(exclude_none=True)
        if not data:
            return self.get_appliance(appliance_id, user_id)
        for key in ("purchase_date", "warranty_expiry", "install_date"):
            if key in data and data[key] is not None:
                data[key] = str(data[key])
        result = (
            self.supabase.table(self.table)
            .update(data)
            .eq("id", appliance_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def delete_appliance(self, appliance_id: str, user_id: str) -> bool:
        result = (
            self.supabase.table(self.table)
            .delete()
            .eq("id", appliance_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(result.data)
