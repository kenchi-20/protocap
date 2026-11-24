import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { students } from "@/lib/seed";
import { saveSessionCookie, getSessionCookie, clearSessionCookie } from "@/lib/auth-cookies";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrate: () => void;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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

  login: async (identifier, password) => {
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

    let userRecord: { id: string; email: string; role: UserRole; name: string; student_id?: string } | null = null;
    const trimmedIdentifier = identifier.trim();
    const cleanIdentifier = trimmedIdentifier.toLowerCase();

    // 1. Check demo non-student users by email
    const match = demoUsers[cleanIdentifier];
    if (match && match.pass === password) {
      userRecord = { id: match.id, email: cleanIdentifier, role: match.role, name: match.name };
    }

    // 2. Check seeded students fallback (by student ID or email)
    if (!userRecord) {
      const studentMatch = students.find((s) => {
        const studentEmail = `${s.name.split(" ")[0].toLowerCase()}@student.test`;
        return (
          s.id.toLowerCase() === cleanIdentifier ||
          studentEmail === cleanIdentifier
        );
      });

      if (studentMatch && password === "student123") {
        userRecord = {
          id: `usr-${studentMatch.name.split(" ")[0].toLowerCase()}`,
          email: `${studentMatch.name.split(" ")[0].toLowerCase()}@student.test`,
          role: "student",
          name: studentMatch.name,
          student_id: studentMatch.id,
        };
      }
    }

    // 3. Database lookup by email or student_id
    if (!userRecord) {
      try {
        const { data: dbData, error: dbError } = await supabase
          .from("users")
          .select("id, email, role, name, student_id")
          .or(`email.ilike.${cleanIdentifier},student_id.eq.${trimmedIdentifier}`)
          .eq("password", password)
          .maybeSingle();

        if (!dbError && dbData) {
          userRecord = {
            id: dbData.id,
            email: dbData.email,
            role: dbData.role as UserRole,
            name: dbData.name,
            student_id: (dbData as { student_id?: string }).student_id,
          };
        } else {
          // Retry without student_id if query failed (e.g. column not yet created in remote DB)
          const fallbackRes = await supabase
            .from("users")
            .select("id, email, role, name")
            .ilike("email", cleanIdentifier)
            .eq("password", password)
            .maybeSingle();

          if (!fallbackRes.error && fallbackRes.data) {
            const fd = fallbackRes.data;
            userRecord = {
              id: fd.id,
              email: fd.email,
              role: fd.role as UserRole,
              name: fd.name,
              student_id: undefined,
            };
          }
        }
      } catch {
        // ignore
      }
    }

    if (!userRecord) {
      return { ok: false, error: "Invalid email or password" };
    }

    // Resolve studentId if role is student and student_id is not already set
    let studentId = userRecord.student_id;
    if (userRecord.role === "student" && !studentId) {
      const matchedStudent = students.find(
        (s) =>
          s.id.toLowerCase() === cleanIdentifier ||
          `${s.name.split(" ")[0].toLowerCase()}@student.test` === userRecord!.email.toLowerCase() ||
          s.name.toLowerCase() === userRecord!.name.toLowerCase()
      );
      if (matchedStudent) {
        studentId = matchedStudent.id;
      }
    }

    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      name: userRecord.name,
      ...(studentId ? { studentId } : {}),
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
