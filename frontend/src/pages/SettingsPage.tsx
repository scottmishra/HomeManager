import { LogOut, User, Sun, Moon } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { useTheme } from "../providers/ThemeProvider";

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 md:max-w-3xl md:px-8 md:pt-8">
      <h1 className="font-display mb-6 text-2xl font-bold text-warm-900 md:text-3xl animate-fade-in">
        Settings
      </h1>

      {/* Account */}
      <section className="mb-7 animate-fade-up stagger-1">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-warm-600">Account</h2>
        <div className="rounded-2xl border border-warm-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-50 p-2.5">
              <User className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-900">{user?.email}</p>
              <p className="text-xs text-warm-500">
                Member since{" "}
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="mb-7 animate-fade-up stagger-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-warm-600">Appearance</h2>
        <div className="rounded-2xl border border-warm-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-50 p-2.5">
                {theme === "dark"
                  ? <Moon className="h-5 w-5 text-brand-600" />
                  : <Sun className="h-5 w-5 text-brand-600" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-warm-900">Dark Mode</p>
                <p className="text-xs text-warm-500">Warm, low-light theme</p>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === "dark"}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                theme === "dark" ? "bg-brand-600" : "bg-warm-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                  theme === "dark" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white p-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 animate-fade-up stagger-3"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
