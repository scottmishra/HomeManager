import { create } from "zustand";
import { api } from "../lib/api";

export interface Home {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  home_type: string;
  year_built?: number;
  square_footage?: number;
  builder?: string;
  num_bedrooms?: number;
  num_bathrooms?: number;
  climate_zone?: string;
  notes?: string;
}

interface HomeState {
  homes: Home[];
  selectedHome: Home | null;
  loading: boolean;
  error: string | null;
  fetchHomes: () => Promise<void>;
  selectHome: (home: Home | null) => void;
  createHome: (data: Partial<Home>) => Promise<Home>;
  updateHome: (id: string, data: Partial<Home>) => Promise<void>;
  deleteHome: (id: string) => Promise<void>;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  homes: [],
  selectedHome: null,
  loading: false,
  error: null,

  fetchHomes: async () => {
    set({ loading: true, error: null });
    try {
      const homes = await api.get<Home[]>("/homes/");
      set({ homes, loading: false });
      // Auto-select first home if none selected
      if (!get().selectedHome && homes.length > 0) {
        set({ selectedHome: homes[0] });
      }
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  selectHome: (home) => set({ selectedHome: home }),

  createHome: async (data) => {
    const home = await api.post<Home>("/homes/", data);
    set((s) => ({ homes: [home, ...s.homes], selectedHome: home }));
    return home;
  },

  updateHome: async (id, data) => {
    const updated = await api.patch<Home>(`/homes/${id}`, data);
    set((s) => ({
      homes: s.homes.map((h) => (h.id === id ? updated : h)),
      selectedHome: s.selectedHome?.id === id ? updated : s.selectedHome,
    }));
  },

  deleteHome: async (id) => {
    await api.delete(`/homes/${id}`);
    set((s) => ({
      homes: s.homes.filter((h) => h.id !== id),
      selectedHome: s.selectedHome?.id === id ? null : s.selectedHome,
    }));
  },
}));
