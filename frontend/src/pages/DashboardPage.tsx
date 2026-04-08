import { useEffect } from "react";
import { useHomeStore } from "../stores/homeStore";
import { useMaintenanceStore } from "../stores/maintenanceStore";
import { useAuth } from "../providers/AuthProvider";
import { Badge } from "../components/ui";
import {
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const { user } = useAuth();
  const { homes, selectedHome, fetchHomes, loading: homesLoading } = useHomeStore();
  const { upcomingTasks, fetchUpcoming } = useMaintenanceStore();

  useEffect(() => {
    fetchHomes();
    fetchUpcoming(14);
  }, [fetchHomes, fetchUpcoming]);

  const urgentTasks = upcomingTasks.filter(
    (t) => t.priority === "urgent" || t.priority === "high",
  );
  const pendingCount = upcomingTasks.filter((t) => t.status === "pending").length;
  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="px-4 pb-6 pt-8 md:px-8 md:pt-10">
      {/* Header */}
      <div className="mb-7 animate-fade-in">
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-warm-600">
          Good day,
        </p>
        <h1 className="font-display text-3xl font-bold text-warm-900 md:text-4xl">
          {firstName}
        </h1>
        {selectedHome && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-warm-600">
            <Home className="h-3.5 w-3.5" />
            {selectedHome.name}
          </p>
        )}
      </div>

      {/* Editorial Stat Cards */}
      <div className="mb-7 grid grid-cols-3 gap-3">
        <div className="animate-fade-up stagger-1 rounded-2xl border border-warm-200 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-warm-500">
            Homes
          </p>
          <p className="font-display text-5xl font-bold leading-none text-warm-900">
            {homes.length}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <Home className="h-3.5 w-3.5 text-warm-400" />
            <span className="text-xs text-warm-400">registered</span>
          </div>
        </div>

        <div className="animate-fade-up stagger-2 rounded-2xl border border-warm-200 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-warm-500">
            Pending
          </p>
          <p className="font-display text-5xl font-bold leading-none text-warm-900">
            {pendingCount}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-warm-400" />
            <span className="text-xs text-warm-400">tasks</span>
          </div>
        </div>

        <div
          className={`animate-fade-up stagger-3 rounded-2xl border p-4 ${
            urgentTasks.length > 0
              ? "border-gold-200 bg-gold-50"
              : "border-warm-200 bg-white"
          }`}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-warm-500">
            Urgent
          </p>
          <p
            className={`font-display text-5xl font-bold leading-none ${
              urgentTasks.length > 0 ? "text-gold-500" : "text-warm-900"
            }`}
          >
            {urgentTasks.length}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-warm-400" />
            <span className="text-xs text-warm-400">high priority</span>
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="mb-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-warm-900">
            Upcoming
          </h2>
          <Link
            to="/schedule"
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            View all
          </Link>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="animate-fade-up stagger-4 rounded-2xl border border-warm-200 bg-white p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-sage-400" />
            <p className="text-sm font-medium text-warm-900">All caught up!</p>
            <p className="mt-0.5 text-xs text-warm-600">No upcoming tasks in the next 14 days.</p>
            <Link
              to="/assistant"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate a schedule
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.slice(0, 5).map((task, i) => (
              <div
                key={task.id}
                className={`animate-fade-up flex items-center gap-3 rounded-xl border border-warm-200 bg-white p-3 transition-all duration-150 hover:border-brand-200 hover:shadow-sm ${
                  i === 0 ? "stagger-1"
                  : i === 1 ? "stagger-2"
                  : i === 2 ? "stagger-3"
                  : i === 3 ? "stagger-4"
                  : "stagger-5"
                }`}
              >
                <Badge
                  variant={
                    task.priority === "urgent" || task.priority === "high"
                      ? task.priority
                      : "medium"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-warm-900">
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-xs text-warm-500">
                    Due: {task.due_date || "Not set"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-warm-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display mb-3 text-xl font-semibold text-warm-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/homes"
            className="flex items-center gap-3 rounded-xl bg-brand-600 p-4 text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Add Home</p>
              <p className="text-xs opacity-75">Set up a home profile</p>
            </div>
          </Link>
          <Link
            to="/homes"
            className="flex items-center gap-3 rounded-xl border border-warm-200 bg-warm-50 p-4 transition-colors hover:bg-warm-100"
          >
            <Plus className="h-5 w-5 shrink-0 text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-warm-900">Upload Manual</p>
              <p className="text-xs text-warm-500">Process a document</p>
            </div>
          </Link>
        </div>
      </div>

      {homesLoading && (
        <div className="mt-4 text-center text-sm text-warm-400">Loading…</div>
      )}
    </div>
  );
}
