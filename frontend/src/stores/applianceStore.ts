import { create } from "zustand";
import { api } from "../lib/api";

export interface Appliance {
  id: string;
  home_id: string;
  name: string;
  brand?: string;
  model_number?: string;
  serial_number?: string;
  category: string;
  purchase_date?: string;
  warranty_expiry?: string;
  install_date?: string;
  location_in_home?: string;
  notes?: string;
}

interface ApplianceState {
  appliances: Appliance[];
  loading: boolean;
  error: string | null;
  fetchAppliances: (homeId: string) => Promise<void>;
  createAppliance: (data: Partial<Appliance>) => Promise<Appliance>;
  updateAppliance: (id: string, data: Partial<Appliance>) => Promise<void>;
  deleteAppliance: (id: string) => Promise<void>;
  clearAppliances: () => void;
}

export const useApplianceStore = create<ApplianceState>((set) => ({
  appliances: [],
  loading: false,
  error: null,

  fetchAppliances: async (homeId) => {
    set({ loading: true, error: null });
    try {
      const appliances = await api.get<Appliance[]>(
        `/appliances/home/${homeId}`,
      );
      set({ appliances, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createAppliance: async (data) => {
    const appliance = await api.post<Appliance>("/appliances/", data);
    set((s) => ({ appliances: [...s.appliances, appliance] }));
    return appliance;
  },

  updateAppliance: async (id, data) => {
    const updated = await api.patch<Appliance>(`/appliances/${id}`, data);
    set((s) => ({
      appliances: s.appliances.map((a) => (a.id === id ? updated : a)),
    }));
  },

  deleteAppliance: async (id) => {
    await api.delete(`/appliances/${id}`);
    set((s) => ({
      appliances: s.appliances.filter((a) => a.id !== id),
    }));
  },

  clearAppliances: () => set({ appliances: [] }),
}));
