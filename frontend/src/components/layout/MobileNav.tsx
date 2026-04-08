import { NavLink } from "react-router-dom";
import { Home, Building2, Calendar, MessageSquare, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../providers/AuthProvider";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard", end: true },
  { to: "/homes", icon: Building2, label: "Homes", end: false },
  { to: "/schedule", icon: Calendar, label: "Schedule", end: false },
  { to: "/assistant", icon: MessageSquare, label: "Assistant", end: false },
  { to: "/settings", icon: Settings, label: "Settings", end: false },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-200 bg-white/95 backdrop-blur-sm pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors duration-150 ${
                isActive
                  ? "text-brand-600 font-semibold"
                  : "text-warm-500 hover:text-warm-800"
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function SidebarNav() {
  const { user, signOut } = useAuth();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-warm-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
          <Home className="h-4 w-4 text-white" />
        </div>
        <span className="font-display text-lg font-bold text-warm-900">HomeManager</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-2">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "border-l-2 border-brand-600 bg-brand-50 pl-[10px] text-brand-700 font-semibold"
                  : "text-warm-600 hover:bg-warm-100 hover:text-warm-900"
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-warm-200 px-4 py-4">
        <p className="mb-2 truncate text-xs text-warm-600">{user?.email}</p>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-warm-600 transition-colors duration-150 hover:bg-warm-100 hover:text-warm-900"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
