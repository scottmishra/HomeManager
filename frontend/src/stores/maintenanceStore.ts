import { create } from "zustand";
import { api } from "../lib/api";

export interface MaintenanceTask {
  id: string;
  home_id: string;
  appliance_id?: string;
  title: string;
  description?: string;
  frequency: string;
  priority: string;
  status: string;
  due_date?: string;
  completed_date?: string;
  estimated_duration_minutes?: number;
  estimated_cost?: number;
  is_ai_generated: boolean;
}

interface MaintenanceState {
  tasks: MaintenanceTask[];
  upcomingTasks: MaintenanceTask[];
  loading: boolean;
  error: string | null;
  fetchTasks: (homeId: string, status?: string) => Promise<void>;
  fetchUpcoming: (days?: number) => Promise<void>;
  createTask: (data: Partial<MaintenanceTask>) => Promise<MaintenanceTask>;
  updateTask: (taskId: string, data: Partial<MaintenanceTask>) => Promise<void>;
  completeTask: (taskId: string, notes?: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  tasks: [],
  upcomingTasks: [],
  loading: false,
  error: null,

  fetchTasks: async (homeId, status) => {
    set({ loading: true, error: null });
    try {
      const params = status ? `?status=${status}` : "";
      const tasks = await api.get<MaintenanceTask[]>(
        `/maintenance/tasks/home/${homeId}${params}`,
      );
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchUpcoming: async (days = 7) => {
    try {
      const tasks = await api.get<MaintenanceTask[]>(
        `/maintenance/tasks/upcoming?days=${days}`,
      );
      set({ upcomingTasks: tasks });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  createTask: async (data) => {
    const task = await api.post<MaintenanceTask>("/maintenance/tasks", data);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (taskId, data) => {
    const updated = await api.patch<MaintenanceTask>(
      `/maintenance/tasks/${taskId}`,
      data,
    );
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)),
      upcomingTasks: s.upcomingTasks.map((t) =>
        t.id === taskId ? updated : t,
      ),
    }));
  },

  completeTask: async (taskId, notes) => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : "";
    await api.post(`/maintenance/tasks/${taskId}/complete${params}`);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: "completed" } : t,
      ),
      upcomingTasks: s.upcomingTasks.filter((t) => t.id !== taskId),
    }));
  },

  deleteTask: async (taskId) => {
    await api.delete(`/maintenance/tasks/${taskId}`);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
    }));
  },
}));
