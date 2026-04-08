import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useMaintenanceStore, type MaintenanceTask } from "../stores/maintenanceStore";
import { useApplianceStore } from "../stores/applianceStore";
import { useHomeStore } from "../stores/homeStore";
import { Modal, ConfirmDialog, Badge } from "../components/ui";
import { TaskForm } from "../components/tasks/TaskForm";
import { CompleteTaskModal } from "../components/tasks/CompleteTaskModal";

const STATUS_FILTERS = [
  "all",
  "pending",
  "upcoming",
  "overdue",
  "completed",
] as const;

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-l-red-500",
  high:   "border-l-gold-400",
  medium: "border-l-warm-300",
  low:    "border-l-warm-200",
};

const STATUS_OPACITY: Record<string, string> = {
  completed: "opacity-60",
  skipped:   "opacity-50",
};

export function SchedulePage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { selectedHome } = useHomeStore();
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, completeTask } =
    useMaintenanceStore();
  const { appliances, fetchAppliances } = useApplianceStore();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<MaintenanceTask | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const [completingTask, setCompletingTask] = useState<MaintenanceTask | null>(null);
  const [taskFormSubmitting, setTaskFormSubmitting] = useState(false);

  useEffect(() => {
    if (selectedHome) {
      fetchTasks(selectedHome.id, statusFilter === "all" ? undefined : statusFilter);
      fetchAppliances(selectedHome.id);
    }
  }, [selectedHome, statusFilter, fetchTasks, fetchAppliances]);

  const openCreateTask = () => { setEditingTask(null); setTaskModalOpen(true); };
  const openEditTask = (task: MaintenanceTask) => { setEditingTask(task); setTaskModalOpen(true); };
  const closeTaskModal = () => { setTaskModalOpen(false); setEditingTask(null); };

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
    <div className="px-4 pb-6 pt-6 md:px-8 md:pt-8">
      {/* Header */}
      <div className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-warm-900 md:text-3xl">
          Schedule
        </h1>
        {selectedHome && (
          <p className="mt-0.5 text-sm text-warm-600">{selectedHome.name}</p>
        )}
      </div>

      {!selectedHome ? (
        <div className="mt-16 text-center">
          <p className="text-sm text-warm-600">
            <Link to="/settings" className="font-medium text-brand-600 hover:text-brand-700">
              Select a home in Settings
            </Link>{" "}
            to view its schedule.
          </p>
        </div>
      ) : (
        <>
          {/* Status filter chips */}
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-0 md:px-0">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors duration-150 ${
                  statusFilter === s
                    ? "bg-brand-600 text-white"
                    : "border border-warm-200 bg-warm-100 text-warm-700 hover:bg-warm-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="mt-16 text-center text-sm text-warm-400">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-warm-200 bg-white p-8 text-center animate-fade-in">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-warm-300" />
              <p className="font-medium text-warm-900">No tasks found</p>
              <p className="mt-1 text-sm text-warm-600">
                Tap + to add one, or ask the assistant to generate a schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task, i) => (
                <div
                  key={task.id}
                  className={`animate-fade-up rounded-xl border border-l-4 border-warm-200 bg-white p-4 transition-shadow duration-150 hover:shadow-sm ${
                    PRIORITY_BORDER[task.priority] ?? "border-l-warm-200"
                  } ${STATUS_OPACITY[task.status] ?? ""} ${
                    i < 5 ? `stagger-${i + 1}` : "stagger-5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-warm-900">
                          {task.title}
                        </p>
                        {task.is_ai_generated && (
                          <Badge variant="ai" label="AI" />
                        )}
                      </div>
                      {task.description && (
                        <p className="mb-2 line-clamp-2 text-xs text-warm-600">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={task.priority as "urgent" | "high" | "medium" | "low"}
                        />
                        <span className="text-xs text-warm-500">
                          Due: {task.due_date || "Not set"}
                        </span>
                        <span className="text-xs capitalize text-warm-400">
                          {task.frequency?.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEditTask(task)}
                        className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-700"
                        title="Edit task"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteTask(task)}
                        className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {task.status !== "completed" && (
                        <button
                          onClick={() => setCompletingTask(task)}
                          className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-sage-50 hover:text-sage-500"
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
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-all duration-150 hover:scale-105 hover:bg-brand-700 hover:shadow-xl md:bottom-8 md:right-8"
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
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={closeTaskModal} disabled={taskFormSubmitting}
              className="flex-1 rounded-lg border border-warm-200 px-4 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" form="task-form" disabled={taskFormSubmitting}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {taskFormSubmitting ? "Saving…" : editingTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        }
      >
        {selectedHome && (
          <TaskForm
            formId="task-form"
            homeId={selectedHome.id}
            appliances={appliances}
            initialValues={editingTask ?? undefined}
            onSubmit={handleTaskSubmit}
            onCancel={closeTaskModal}
            onSubmittingChange={setTaskFormSubmitting}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteTask}
        onClose={() => setConfirmDeleteTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Delete "${confirmDeleteTask?.title}"?`}
        isLoading={deletingTask}
      />

      <CompleteTaskModal
        isOpen={!!completingTask}
        onClose={() => setCompletingTask(null)}
        taskTitle={completingTask?.title ?? ""}
        onConfirm={handleCompleteTask}
      />
    </div>
  );
}
