import { NavLink } from "react-router-dom";
import { Home, Calendar, MessageSquare, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/schedule", icon: Calendar, label: "Schedule", end: false },
  { to: "/assistant", icon: MessageSquare, label: "Assistant", end: false },
  { to: "/settings", icon: Settings, label: "Settings", end: false },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 text-xs ${
                isActive
                  ? "text-brand-600 font-semibold"
                  : "text-gray-500"
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
