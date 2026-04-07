import { useEffect } from "react";
import { useHomeStore } from "../stores/homeStore";
import { useMaintenanceStore } from "../stores/maintenanceStore";
import { useAuth } from "../providers/AuthProvider";
import {
  Home,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
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

  const urgentTasks = upcomingTasks.filter((t) => t.priority === "urgent" || t.priority === "high");
  const pendingCount = upcomingTasks.filter((t) => t.status === "pending").length;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {selectedHome ? selectedHome.name : "No home selected"}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-white p-3 border border-gray-200 text-center">
          <Home className="mx-auto h-5 w-5 text-brand-600 mb-1" />
          <p className="text-xl font-bold">{homes.length}</p>
          <p className="text-xs text-gray-500">Homes</p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-gray-200 text-center">
          <Clock className="mx-auto h-5 w-5 text-amber-500 mb-1" />
          <p className="text-xl font-bold">{pendingCount}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-gray-200 text-center">
          <AlertTriangle className="mx-auto h-5 w-5 text-red-500 mb-1" />
          <p className="text-xl font-bold">{urgentTasks.length}</p>
          <p className="text-xs text-gray-500">Urgent</p>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Upcoming Tasks</h2>
          <Link
            to="/schedule"
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-200 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-gray-600">All caught up! No upcoming tasks.</p>
            <Link
              to="/assistant"
              className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-700"
            >
              Ask the assistant to generate a schedule
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    Due: {task.due_date || "Not set"} &middot;{" "}
                    <span
                      className={
                        task.priority === "urgent"
                          ? "text-red-500"
                          : task.priority === "high"
                            ? "text-amber-500"
                            : "text-gray-500"
                      }
                    >
                      {task.priority}
                    </span>
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/assistant"
            className="flex items-center gap-3 rounded-xl bg-brand-600 p-4 text-white"
          >
            <Plus className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Add Home</p>
              <p className="text-xs opacity-80">Set up a new home profile</p>
            </div>
          </Link>
          <Link
            to="/assistant"
            className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-4"
          >
            <Plus className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-sm font-medium">Upload Manual</p>
              <p className="text-xs text-gray-500">Process a document</p>
            </div>
          </Link>
        </div>
      </div>

      {homesLoading && (
        <div className="mt-4 text-center text-sm text-gray-400">Loading...</div>
      )}
    </div>
  );
}
