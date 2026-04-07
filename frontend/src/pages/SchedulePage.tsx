import { useEffect, useState } from "react";
import { useMaintenanceStore } from "../stores/maintenanceStore";
import { useHomeStore } from "../stores/homeStore";
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";

const STATUS_FILTERS = ["all", "pending", "upcoming", "overdue", "completed"] as const;

const PRIORITY_ICON = {
  urgent: <AlertTriangle className="h-4 w-4 text-red-500" />,
  high: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  medium: <Clock className="h-4 w-4 text-blue-500" />,
  low: <Circle className="h-4 w-4 text-gray-400" />,
};

export function SchedulePage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { selectedHome } = useHomeStore();
  const { tasks, loading, fetchTasks, completeTask } = useMaintenanceStore();

  useEffect(() => {
    if (selectedHome) {
      fetchTasks(
        selectedHome.id,
        statusFilter === "all" ? undefined : statusFilter,
      );
    }
  }, [selectedHome, statusFilter, fetchTasks]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Maintenance Schedule</h1>

      {!selectedHome ? (
        <p className="text-gray-500 text-center mt-10">
          Select a home from the dashboard to view its schedule.
        </p>
      ) : (
        <>
          {/* Status filter chips */}
          <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs capitalize ${
                  statusFilter === s
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-center text-gray-400 mt-10">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">
              No tasks found. Ask the assistant to generate a maintenance schedule!
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl bg-white border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {PRIORITY_ICON[task.priority as keyof typeof PRIORITY_ICON] ||
                        PRIORITY_ICON.medium}
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                          <span>Due: {task.due_date || "Not set"}</span>
                          <span className="capitalize">{task.frequency}</span>
                        </div>
                      </div>
                    </div>
                    {task.status !== "completed" && (
                      <button
                        onClick={() => completeTask(task.id)}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                        title="Mark complete"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  {task.is_ai_generated && (
                    <span className="mt-2 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-600">
                      AI Generated
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
