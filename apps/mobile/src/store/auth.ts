import { create } from "zustand";
import type { User } from "@/types";
import { getMe, login, logout, register } from "@/api/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  hydrated: false,

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { user } = await login(email, password);
      set({ user });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true });
    try {
      const { user } = await register(email, password, name);
      set({ user });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await logout();
    set({ user: null });
  },

  refresh: async () => {
    try {
      const user = await getMe();
      set({ user, hydrated: true });
    } catch {
      set({ user: null, hydrated: true });
    }
  },
}));
