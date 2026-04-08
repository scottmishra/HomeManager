import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { SchedulePage } from "./pages/SchedulePage";
import { AssistantPage } from "./pages/AssistantPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HomesPage } from "./pages/HomesPage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-warm-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/homes" element={<HomesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
