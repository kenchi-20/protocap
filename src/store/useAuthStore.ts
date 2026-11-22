import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { saveSessionCookie, getSessionCookie, clearSessionCookie } from "@/lib/auth-cookies";
import type { User, UserRole } from "@/types";

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
    // Demo credentials fallback for prototype / offline / unseeded DB
    const demoUsers: Record<string, { id: string; role: UserRole; name: string; pass: string }> = {
      "maria@parent.test": { id: "usr-maria", role: "parent", name: "Mrs. Maria Dela Cruz", pass: "parent123" },
      "paulo@parent.test": { id: "usr-paulo", role: "parent", name: "Mr. Paulo Villanueva", pass: "parent123" },
      "liza@parent.test": { id: "usr-liza", role: "parent", name: "Mrs. Liza Santos", pass: "parent123" },
      "elena@parent.test": { id: "usr-elena", role: "parent", name: "Mrs. Elena Ramirez", pass: "parent123" },
      "henry@parent.test": { id: "usr-henry", role: "parent", name: "Mr. Henry Tan", pass: "parent123" },
      "osalla@teacher.test": { id: "usr-osalla", role: "teacher", name: "Ms. Rovilyn Osalla", pass: "teacher123" },
      "bautista@teacher.test": { id: "usr-bautista", role: "teacher", name: "Mr. Carlo Bautista", pass: "teacher123" },
      "flores@teacher.test": { id: "usr-flores", role: "teacher", name: "Ms. Diane Flores", pass: "teacher123" },
      "navarro@teacher.test": { id: "usr-navarro", role: "teacher", name: "Mr. Joel Navarro", pass: "teacher123" },
      "security@admin.test": { id: "usr-security", role: "security", name: "Security Desk", pass: "admin123" },
      "principal@admin.test": { id: "usr-principal", role: "admin", name: "Principal Desk", pass: "admin123" },
    };

    let userRecord: { id: string; email: string; role: UserRole; name: string } | null = null;
    const cleanEmail = email.trim().toLowerCase();

    const match = demoUsers[cleanEmail];
    if (match && match.pass === password) {
      userRecord = { id: match.id, email: cleanEmail, role: match.role, name: match.name };
    } else {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, email, role, name")
          .eq("email", cleanEmail)
          .eq("password", password)
          .single();

        if (!error && data) {
          userRecord = data as { id: string; email: string; role: UserRole; name: string };
        }
      } catch {
        // ignore
      }
    }

    if (!userRecord) {
      return { ok: false, error: "Invalid email or password" };
    }

    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      name: userRecord.name,
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
