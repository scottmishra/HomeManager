import { useAuth } from "../providers/AuthProvider";
import { useHomeStore } from "../stores/homeStore";
import { LogOut, User, Home } from "lucide-react";

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { homes, selectedHome, selectHome } = useHomeStore();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Profile */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Account
        </h2>
        <div className="rounded-xl bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-100 p-2">
              <User className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500">
                Member since{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Home Selection */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Active Home
        </h2>
        <div className="space-y-2">
          {homes.map((home) => (
            <button
              key={home.id}
              onClick={() => selectHome(home)}
              className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left ${
                selectedHome?.id === home.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Home
                className={`h-5 w-5 ${
                  selectedHome?.id === home.id
                    ? "text-brand-600"
                    : "text-gray-400"
                }`}
              />
              <div>
                <p className="text-sm font-medium">{home.name}</p>
                <p className="text-xs text-gray-500">
                  {[home.city, home.state].filter(Boolean).join(", ") ||
                    "No location set"}
                </p>
              </div>
            </button>
          ))}
          {homes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No homes added yet. Use the assistant to set one up!
            </p>
          )}
        </div>
      </section>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white p-3 text-sm text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
