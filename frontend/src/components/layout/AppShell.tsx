import type { ReactNode } from "react";
import { MobileNav, SidebarNav } from "./MobileNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-grain flex min-h-screen bg-warm-50">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:fixed md:inset-y-0 md:z-20 md:flex md:w-60">
        <SidebarNav />
      </div>

      {/* Main content — offset right on desktop to clear sidebar */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom nav — hidden on desktop */}
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </div>
  );
}
