import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { saveSessionCookie, getSessionCookie, clearSessionCookie } from "@/lib/auth-cookies";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  hydrate: () => {
    const user = getSessionCookie();
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  login: async (email, password) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, name")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      return { ok: false, error: "Invalid email or password" };
    }

    const user: User = {
      id: data.id,
      email: data.email,
      role: data.role,
      name: data.name,
    };

    saveSessionCookie(user);
    set({ user, isAuthenticated: true });
    return { ok: true };
  },

  logout: () => {
    clearSessionCookie();
    set({ user: null, isAuthenticated: false });
  },
}));
