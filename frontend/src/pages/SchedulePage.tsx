import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMaintenanceStore, type MaintenanceTask } from "../stores/maintenanceStore";
import { useApplianceStore } from "../stores/applianceStore";
import { useHomeStore } from "../stores/homeStore";
import { Modal, ConfirmDialog } from "../components/ui";
import { TaskForm } from "../components/tasks/TaskForm";
import { CompleteTaskModal } from "../components/tasks/CompleteTaskModal";

const STATUS_FILTERS = [
  "all",
  "pending",
  "upcoming",
  "overdue",
  "completed",
] as const;

const PRIORITY_ICON = {
  urgent: <AlertTriangle className="h-4 w-4 text-red-500" />,
  high: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  medium: <Clock className="h-4 w-4 text-blue-500" />,
  low: <Circle className="h-4 w-4 text-gray-400" />,
};

export function SchedulePage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { selectedHome } = useHomeStore();
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, completeTask } =
    useMaintenanceStore();
  const { appliances, fetchAppliances } = useApplianceStore();

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] =
    useState<MaintenanceTask | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  // Complete task modal state
  const [completingTask, setCompletingTask] = useState<MaintenanceTask | null>(
    null,
  );

  useEffect(() => {
    if (selectedHome) {
      fetchTasks(
        selectedHome.id,
        statusFilter === "all" ? undefined : statusFilter,
      );
      fetchAppliances(selectedHome.id);
    }
  }, [selectedHome, statusFilter, fetchTasks, fetchAppliances]);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };
  const openEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };
  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = async (values: Partial<MaintenanceTask>) => {
    if (editingTask) {
      await updateTask(editingTask.id, values);
    } else {
      await createTask({ ...values, home_id: selectedHome!.id });
    }
    closeTaskModal();
  };

  const handleDeleteTask = async () => {
    if (!confirmDeleteTask) return;
    setDeletingTask(true);
    try {
      await deleteTask(confirmDeleteTask.id);
      setConfirmDeleteTask(null);
    } finally {
      setDeletingTask(false);
    }
  };

  const handleCompleteTask = async (notes: string) => {
    if (!completingTask) return;
    await completeTask(completingTask.id, notes);
    setCompletingTask(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Maintenance Schedule</h1>

      {!selectedHome ? (
        <p className="text-gray-500 text-center mt-10">
          <Link to="/settings" className="text-brand-600 hover:text-brand-700">
            Select a home in Settings
          </Link>{" "}
          to view its schedule.
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
            <p className="text-center text-gray-400 mt-10">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">
              No tasks found. Tap + to add one or ask the assistant to generate
              a schedule!
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl bg-white border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {PRIORITY_ICON[
                        task.priority as keyof typeof PRIORITY_ICON
                      ] ?? PRIORITY_ICON.medium}
                    </div>
                    <div className="flex-1 min-w-0">
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
                      {task.is_ai_generated && (
                        <span className="mt-2 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-600">
                          AI Generated
                        </span>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditTask(task)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit task"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteTask(task)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {task.status !== "completed" && (
                        <button
                          onClick={() => setCompletingTask(task)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
                          title="Mark complete"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating action button */}
      {selectedHome && (
        <button
          onClick={openCreateTask}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 shadow-lg hover:bg-brand-700 text-white"
          title="Add task"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Task create/edit modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={closeTaskModal}
        title={editingTask ? "Edit Task" : "New Task"}
      >
        {selectedHome && (
          <TaskForm
            homeId={selectedHome.id}
            appliances={appliances}
            initialValues={editingTask ?? undefined}
            onSubmit={handleTaskSubmit}
            onCancel={closeTaskModal}
            submitLabel={editingTask ? "Save Changes" : "Create Task"}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteTask}
        onClose={() => setConfirmDeleteTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Delete "${confirmDeleteTask?.title}"?`}
        isLoading={deletingTask}
      />

      {/* Complete with notes */}
      <CompleteTaskModal
        isOpen={!!completingTask}
        onClose={() => setCompletingTask(null)}
        taskTitle={completingTask?.title ?? ""}
        onConfirm={handleCompleteTask}
      />
    </div>
  );
}
