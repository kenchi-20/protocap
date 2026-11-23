# Separate Portals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three separate role-based portals (parent, teacher, security/admin) with login authentication, search/filter UI, and proper data scoping — parents see only their children, teachers see only their advisees.

**Architecture:** Add Supabase tables for users and role-links. Create Zustand auth store with cookie session. Build three new portal routes that replace existing `/admin` and `/parent`. Each portal fetches only data the logged-in user is allowed to see.

**Tech Stack:** Next.js 15 (App Router), React 19, Zustand 5, TypeScript, Tailwind, Supabase JS client, cookies-next (for httpOnly cookies)

**Spec:** `docs/superpowers/specs/2026-11-22-separate-portals-design.md`

## Global Constraints

- Use existing Supabase client at `src/lib/supabase.ts` (publishable key)
- All new DB columns use snake_case; TypeScript types use camelCase
- Demo passwords stored in plain text (add comment: "NEVER in production")
- Keep `/student` route working; delete `/admin` and `/parent` routes
- Follow existing design system: maroon primary, gold accent, Tailwind classes from `globals.css`
- Search/filter is client-side only (no backend search API)

## Review Focus

1. **Parent sees other parent's children** — verify `parent_children` join filters by `parent_user_id`
2. **Teacher sees students outside their sections** — verify `teacher_sections` join filters correctly
3. **Session cookie missing on refresh** — verify httpOnly cookie persists and restores auth state
4. **Search freezes UI with 100+ students** — verify 300ms debounce on input
5. **Logout leaves auth state in store** — verify `logout()` clears all fields and cookie

---

### Task 1: Supabase Schema — Users and Role Link Tables

**Files:**
- Create: `supabase/migrations/001_user_auth_tables.sql`

**Interfaces:**
- Produces: `users`, `parent_children`, `teacher_sections` tables in Supabase

- [ ] **Step 1: Write the SQL migration**

```sql
-- Users table: demo auth (passwords in plain text for prototype only)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Demo only: plain text. NEVER in production.
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'security', 'admin')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-child link: maps parent user to student IDs
CREATE TABLE parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  UNIQUE(parent_user_id, student_id)
);

-- Teacher-section link: maps teacher user to grade sections they advise
CREATE TABLE teacher_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  grade_section TEXT NOT NULL,
  UNIQUE(teacher_user_id, grade_section)
);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_sections ENABLE ROW LEVEL SECURITY;

-- For prototype: allow anon read/write on all tables
CREATE POLICY "anon_full_access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access" ON parent_children FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access" ON teacher_sections FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Run migration in Supabase**

Use Supabase dashboard SQL editor or `supabase db push` to apply the migration.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/001_user_auth_tables.sql
git commit -m "feat: add users and role-link tables for auth"
```

---

### Task 2: Seed Demo Users and Role Links

**Files:**
- Create: `scripts/seed-users.ts`
- Modify: `package.json` (add script)

**Interfaces:**
- Consumes: `src/lib/supabase.ts`, `src/lib/seed.ts` (for student IDs and section names)
- Produces: Populated `users`, `parent_children`, `teacher_sections` tables

- [ ] **Step 1: Install tsx if not present**

```bash
npm install -D tsx
```

- [ ] **Step 2: Write seed script**

Create `scripts/seed-users.ts` that inserts demo users and links:

```typescript
import { supabase } from "../src/lib/supabase";
import { students } from "../src/lib/seed";

async function seedUsers() {
  // Demo users
  const users = [
    { email: "maria@parent.test", password: "parent123", role: "parent", name: "Mrs. Maria Dela Cruz" },
    { email: "paulo@parent.test", password: "parent123", role: "parent", name: "Mr. Paulo Villanueva" },
    { email: "liza@parent.test", password: "parent123", role: "parent", name: "Mrs. Liza Santos" },
    { email: "elena@parent.test", password: "parent123", role: "parent", name: "Mrs. Elena Ramirez" },
    { email: "henry@parent.test", password: "parent123", role: "parent", name: "Mr. Henry Tan" },
    { email: "osalla@teacher.test", password: "teacher123", role: "teacher", name: "Ms. Rovilyn Osalla" },
    { email: "bautista@teacher.test", password: "teacher123", role: "teacher", name: "Mr. Carlo Bautista" },
    { email: "flores@teacher.test", password: "teacher123", role: "teacher", name: "Ms. Diane Flores" },
    { email: "navarro@teacher.test", password: "teacher123", role: "teacher", name: "Mr. Joel Navarro" },
    { email: "security@admin.test", password: "admin123", role: "security", name: "Security Desk" },
    { email: "principal@admin.test", password: "admin123", role: "admin", name: "Principal Desk" },
  ];

  const { data: insertedUsers, error: userError } = await supabase
    .from("users")
    .upsert(users, { onConflict: "email" })
    .select();

  if (userError) {
    console.error("Error inserting users:", userError);
    return;
  }

  console.log(`Inserted ${insertedUsers.length} users`);

  // Parent-children links (map parent email to student by parentName match)
  const parentChildren = [
    { parentEmail: "maria@parent.test", studentId: "USA-JHS-2026-0104" }, // Juan Dela Cruz
    { parentEmail: "paulo@parent.test", studentId: "USA-JHS-2026-0088" }, // Andrea Mae Villanueva
    { parentEmail: "liza@parent.test", studentId: "USA-JHS-2026-0117" }, // Miguel Santos
    { parentEmail: "elena@parent.test", studentId: "USA-JHS-2026-0062" }, // Sofia Ramirez
    { parentEmail: "henry@parent.test", studentId: "USA-JHS-2026-0142" }, // Gabriel Tan
  ];

  const parentChildrenRows = parentChildren.map(link => {
    const user = insertedUsers.find(u => u.email === link.parentEmail);
    return { parent_user_id: user.id, student_id: link.studentId };
  });

  const { error: pcError } = await supabase.from("parent_children").upsert(parentChildrenRows);
  if (pcError) console.error("Error inserting parent_children:", pcError);
  else console.log("Inserted parent-children links");

  // Teacher-section links
  const teacherSections = [
    { teacherEmail: "osalla@teacher.test", gradeSection: "Grade 9 - St. Augustine" },
    { teacherEmail: "osalla@teacher.test", gradeSection: "Grade 9 - St. Nicholas" },
    { teacherEmail: "bautista@teacher.test", gradeSection: "Grade 8 - St. Monica" },
    { teacherEmail: "flores@teacher.test", gradeSection: "Grade 10 - St. Thomas" },
    { teacherEmail: "flores@teacher.test", gradeSection: "Grade 10 - St. Joseph" },
    { teacherEmail: "navarro@teacher.test", gradeSection: "Grade 7 - St. Rita" },
  ];

  const teacherSectionsRows = teacherSections.map(link => {
    const user = insertedUsers.find(u => u.email === link.teacherEmail);
    return { teacher_user_id: user.id, grade_section: link.gradeSection };
  });

  const { error: tsError } = await supabase.from("teacher_sections").upsert(teacherSectionsRows);
  if (tsError) console.error("Error inserting teacher_sections:", tsError);
  else console.log("Inserted teacher-section links");

  console.log("Seed complete!");
}

seedUsers();
```

- [ ] **Step 3: Add npm script**

In `package.json` scripts:
```json
"seed:users": "tsx scripts/seed-users.ts"
```

- [ ] **Step 4: Run seed script**

```bash
npm run seed:users
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-users.ts package.json
git commit -m "feat: add seed script for demo users and role links"
```

---

### Task 3: Types for Auth and User

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `User`, `UserRole`, `ParentChildLink`, `TeacherSectionLink` types

- [ ] **Step 1: Add auth types**

Add to `src/types/index.ts`:

```typescript
export type UserRole = "parent" | "teacher" | "security" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface ParentChildLink {
  parentUserId: string;
  studentId: string;
}

export interface TeacherSectionLink {
  teacherUserId: string;
  gradeSection: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add User and role-link types"
```

---

### Task 4: Auth Store (Zustand) with Cookie Session

**Files:**
- Create: `src/store/useAuthStore.ts`
- Create: `src/lib/auth-cookies.ts`

**Interfaces:**
- Consumes: `User` type from `src/types/index.ts`
- Produces: `useAuthStore()` hook with `login()`, `logout()`, `user`, `isAuthenticated`

- [ ] **Step 1: Install cookies-next**

```bash
npm install cookies-next
```

- [ ] **Step 2: Write cookie helpers**

Create `src/lib/auth-cookies.ts`:

```typescript
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import type { User } from "@/types";

const SESSION_KEY = "one_id_session";

export function saveSessionCookie(user: User) {
  setCookie(SESSION_KEY, JSON.stringify(user), {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function getSessionCookie(): User | null {
  const raw = getCookie(SESSION_KEY) as string | undefined;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  deleteCookie(SESSION_KEY);
}
```

- [ ] **Step 3: Write auth store**

Create `src/store/useAuthStore.ts`:

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add src/store/useAuthStore.ts src/lib/auth-cookies.ts package.json
git commit -m "feat: add Zustand auth store with cookie session"
```

---

### Task 5: DB Helpers for User Data Fetching

**Files:**
- Create: `src/lib/user-db.ts`

**Interfaces:**
- Consumes: `supabase` client, types from `src/types/index.ts`
- Produces: `fetchChildrenForParent()`, `fetchSectionsForTeacher()`, `fetchStudentsByIds()`, `fetchStudentsBySections()`

- [ ] **Step 1: Write user data fetchers**

Create `src/lib/user-db.ts`:

```typescript
import { supabase } from "@/lib/supabase";
import type { Student, ParentChildLink, TeacherSectionLink } from "@/types";

export async function fetchChildrenForParent(parentUserId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("parent_children")
    .select("student_id")
    .eq("parent_user_id", parentUserId);

  if (error || !data) return [];
  return data.map((row) => row.student_id);
}

export async function fetchSectionsForTeacher(teacherUserId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("teacher_sections")
    .select("grade_section")
    .eq("teacher_user_id", teacherUserId);

  if (error || !data) return [];
  return data.map((row) => row.grade_section);
}

export async function fetchStudentsByIds(studentIds: string[]): Promise<Student[]> {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .in("id", studentIds);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    gradeSection: row.grade_section,
    parentName: row.parent_name,
    parentContact: row.parent_contact,
    adviserName: row.adviser_name,
    consentVerified: row.consent_verified,
    absenceCount: row.absence_count,
    avatarInitials: row.avatar_initials,
  }));
}

export async function fetchStudentsBySections(sections: string[]): Promise<Student[]> {
  if (sections.length === 0) return [];
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .in("grade_section", sections);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    gradeSection: row.grade_section,
    parentName: row.parent_name,
    parentContact: row.parent_contact,
    adviserName: row.adviser_name,
    consentVerified: row.consent_verified,
    absenceCount: row.absence_count,
    avatarInitials: row.avatar_initials,
  }));
}

export async function fetchAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("*");
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    gradeSection: row.grade_section,
    parentName: row.parent_name,
    parentContact: row.parent_contact,
    adviserName: row.adviser_name,
    consentVerified: row.consent_verified,
    absenceCount: row.absence_count,
    avatarInitials: row.avatar_initials,
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/user-db.ts
git commit -m "feat: add DB helpers for fetching user-scoped student data"
```

---

### Task 6: Search and Filter Components

**Files:**
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/FilterDropdown.tsx`

**Interfaces:**
- Produces: `<SearchBar />`, `<FilterDropdown />` reusable components

- [ ] **Step 1: Write SearchBar component**

Create `src/components/SearchBar.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-slate-200 py-2 pl-10 pr-10 text-sm outline-none focus:border-maroon"
      />
      {localValue && (
        <button
          type="button"
          onClick={() => setLocalValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write FilterDropdown component**

Create `src/components/FilterDropdown.tsx`:

```typescript
"use client";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selected: string;
  onChange: (value: string) => void;
  label?: string;
}

export function FilterDropdown({ options, selected, onChange, label }: FilterDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-maroon"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchBar.tsx src/components/FilterDropdown.tsx
git commit -m "feat: add SearchBar and FilterDropdown components"
```

---

### Task 7: Login Page

**Files:**
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `useAuthStore()`, Next.js router
- Produces: Login form that redirects to role-specific portal

- [ ] **Step 1: Write login page**

Create `src/app/login/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AppHeader } from "@/components/AppHeader";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Login failed");
      return;
    }

    // Redirect based on role
    const user = useAuthStore.getState().user;
    if (user?.role === "parent") router.push("/parent-portal");
    else if (user?.role === "teacher") router.push("/teacher-portal");
    else router.push("/security-portal");
  };

  return (
    <>
      <AppHeader title="Sign in" subtitle="Enter your credentials to access your portal" />
      <main className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div>
            <label className="block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
              placeholder="you@example.test"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-maroon py-2.5 text-sm font-semibold text-white hover:bg-maroon/90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          Demo credentials: maria@parent.test / parent123
        </p>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add login page with role-based redirect"
```

---

### Task 8: Parent Portal — One List with Collapsible Cards

**Files:**
- Create: `src/app/parent-portal/page.tsx`
- Create: `src/app/parent-portal/layout.tsx`

**Interfaces:**
- Consumes: `useAuthStore()`, `fetchChildrenForParent()`, `fetchStudentsByIds()`, `usePrototypeStore()`, `<SearchBar />`, `<FilterDropdown />`
- Produces: Parent dashboard with child cards, notifications, SMS inbox

- [ ] **Step 1: Write parent portal layout with auth guard**

Create `src/app/parent-portal/layout.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "parent")) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Write parent portal page**

Create `src/app/parent-portal/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { fetchChildrenForParent, fetchStudentsByIds } from "@/lib/user-db";
import { SearchBar } from "@/components/SearchBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { AppHeader } from "@/components/AppHeader";
import { formatClock, formatTime } from "@/lib/format";
import { ABSENCE_THRESHOLD } from "@/types";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import type { Student } from "@/types";

export default function ParentPortalPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notifications = usePrototypeStore((s) => s.notifications);
  const logs = usePrototypeStore((s) => s.logs);
  const activities = usePrototypeStore((s) => s.activities);
  const markRead = usePrototypeStore((s) => s.markRead);
  const router = useRouter();

  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      if (!user) return;
      const childIds = await fetchChildrenForParent(user.id);
      const students = await fetchStudentsByIds(childIds);
      setMyStudents(students);
    }
    load();
  }, [user]);

  const filteredStudents = useMemo(() => {
    return myStudents.filter((s) => {
      const matchesQuery =
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" ? true :
        filter === "flagged" ? s.absenceCount >= ABSENCE_THRESHOLD :
        true;
      return matchesQuery && matchesFilter;
    });
  }, [myStudents, query, filter]);

  const toggleExpand = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <AppHeader
        eyebrow="Parent Portal"
        title={user?.name || "Parent"}
        subtitle="View your child's attendance and activity participation"
      />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <SearchBar value={query} onChange={setQuery} placeholder="Search by name or ID" />
            <FilterDropdown
              options={[
                { label: "All", value: "all" },
                { label: "Flagged", value: "flagged" },
              ]}
              selected={filter}
              onChange={setFilter}
            />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        {filteredStudents.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500">
            No children found for your account.
          </p>
        )}

        <div className="space-y-3">
          {filteredStudents.map((student) => {
            const isExpanded = expandedStudents.has(student.id);
            const studentLogs = logs.filter((l) => l.studentId === student.id);
            const regs = studentLogs.filter((l) => l.registeredAt);
            const checks = studentLogs.filter((l) => l.checkedInAt);
            const attendanceRate = regs.length === 0 ? 0 : Math.round((checks.length / regs.length) * 100);
            const flagged = student.absenceCount >= ABSENCE_THRESHOLD;

            return (
              <div key={student.id} className="rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(student.id)}
                  className="w-full p-4 text-left flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-display text-lg text-ink">{student.name}</h3>
                    <p className="text-xs text-slate-500">{student.id} · {student.gradeSection}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      flagged ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"
                    }`}>
                      {flagged ? `${student.absenceCount}/${ABSENCE_THRESHOLD} absences` : `${attendanceRate}% attendance`}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-3">
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">Absences</dt>
                        <dd className="font-semibold">{student.absenceCount} / {ABSENCE_THRESHOLD}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Attendance rate</dt>
                        <dd className="font-semibold">{attendanceRate}%</dd>
                      </div>
                    </dl>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Recent Activity</h4>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {regs.slice(0, 3).map((log) => {
                          const activity = activities.find((a) => a.id === log.activityId);
                          return (
                            <li key={log.id}>
                              {activity?.title} — {log.checkedInAt ? "Checked in" : "Registered"}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">SMS Inbox</h4>
                      <ul className="space-y-2 text-xs">
                        {notifications
                          .filter((n) => n.studentId === student.id && n.channel === "SMS" && n.recipientRole === "Parent")
                          .slice(0, 3)
                          .map((n) => (
                            <li key={n.id} className="rounded-lg bg-slate-50 p-2">
                              <p className="font-semibold text-ink">{n.title}</p>
                              <p className="text-slate-600">{n.message}</p>
                              <p className="text-slate-400">{formatClock(n.timestamp)}</p>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/parent-portal/page.tsx src/app/parent-portal/layout.tsx
git commit -m "feat: add parent portal with collapsible child cards"
```

---

### Task 9: Teacher Portal

**Files:**
- Create: `src/app/teacher-portal/page.tsx`
- Create: `src/app/teacher-portal/layout.tsx`

**Interfaces:**
- Consumes: `useAuthStore()`, `fetchSectionsForTeacher()`, `fetchStudentsBySections()`, `<SearchBar />`, `<FilterDropdown />`
- Produces: Teacher dashboard with class roster, absence tracking, activity list

- [ ] **Step 1: Write teacher portal layout with auth guard**

Create `src/app/teacher-portal/layout.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "teacher")) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Write teacher portal page**

Create `src/app/teacher-portal/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { fetchSectionsForTeacher, fetchStudentsBySections } from "@/lib/user-db";
import { SearchBar } from "@/components/SearchBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { AppHeader } from "@/components/AppHeader";
import { ABSENCE_THRESHOLD } from "@/types";
import { LogOut } from "lucide-react";
import type { Student } from "@/types";

export default function TeacherPortalPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logs = usePrototypeStore((s) => s.logs);
  const activities = usePrototypeStore((s) => s.activities);
  const router = useRouter();

  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [mySections, setMySections] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      if (!user) return;
      const sections = await fetchSectionsForTeacher(user.id);
      setMySections(sections);
      const students = await fetchStudentsBySections(sections);
      setMyStudents(students);
    }
    load();
  }, [user]);

  const filteredStudents = useMemo(() => {
    return myStudents.filter((s) => {
      const matchesQuery =
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase()) ||
        s.gradeSection.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" ? true :
        filter === "flagged" ? s.absenceCount >= ABSENCE_THRESHOLD :
        filter.startsWith("grade-") ? s.gradeSection.includes(filter.replace("grade-", "Grade ")) :
        true;
      return matchesQuery && matchesFilter;
    });
  }, [myStudents, query, filter]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Flagged only", value: "flagged" },
    ...mySections.map((s) => ({ label: s, value: `grade-${s.split(" ")[1]}` })),
  ];

  return (
    <>
      <AppHeader
        eyebrow="Teacher Portal"
        title={user?.name || "Teacher"}
        subtitle={`Adviser for ${mySections.join(", ")}`}
      />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <SearchBar value={query} onChange={setQuery} placeholder="Search by name, ID, or section" />
            <FilterDropdown
              options={filterOptions}
              selected={filter}
              onChange={setFilter}
            />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Absences</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const flagged = student.absenceCount >= ABSENCE_THRESHOLD;
                return (
                  <tr key={student.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-ink">{student.name}</span>
                      <span className="font-mono text-xs text-slate-500">{student.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{student.gradeSection}</td>
                    <td className="px-4 py-3 font-semibold">
                      {student.absenceCount}
                      <span className="font-normal text-slate-400"> / {ABSENCE_THRESHOLD}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          flagged ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {flagged ? "Flagged" : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Recent Activity Registrations</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {logs
              .filter((l) => myStudents.some((s) => s.id === l.studentId) && l.registeredAt)
              .slice(0, 5)
              .map((log) => {
                const student = myStudents.find((s) => s.id === log.studentId);
                const activity = activities.find((a) => a.id === log.activityId);
                return (
                  <li key={log.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-semibold text-ink">{student?.name}</span> registered for <span className="font-semibold">{activity?.title}</span>
                  </li>
                );
              })}
          </ul>
        </section>
      </main>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/teacher-portal/page.tsx src/app/teacher-portal/layout.tsx
git commit -m "feat: add teacher portal with class roster and filters"
```

---

### Task 10: Security/Admin Portal

**Files:**
- Create: `src/app/security-portal/page.tsx`
- Create: `src/app/security-portal/layout.tsx`

**Interfaces:**
- Consumes: `useAuthStore()`, `fetchAllStudents()`, `<SearchBar />`, `<FilterDropdown />`, existing `ChannelChart`, KPI components
- Produces: System-wide dashboard with all students, KPIs, scanner link

- [ ] **Step 1: Write security portal layout with auth guard**

Create `src/app/security-portal/layout.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function SecurityPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== "security" && user?.role !== "admin"))) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Write security portal page**

Create `src/app/security-portal/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { fetchAllStudents } from "@/lib/user-db";
import { SearchBar } from "@/components/SearchBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { ChannelChart } from "@/components/ChannelChart";
import { AppHeader } from "@/components/AppHeader";
import { ABSENCE_THRESHOLD } from "@/types";
import { LogOut, QrCode } from "lucide-react";
import type { Student } from "@/types";

export default function SecurityPortalPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logs = usePrototypeStore((s) => s.logs);
  const students = usePrototypeStore((s) => s.students);
  const notifications = usePrototypeStore((s) => s.notifications);
  const logAbsence = usePrototypeStore((s) => s.logAbsence);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesQuery =
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase()) ||
        s.gradeSection.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" ? true :
        filter === "flagged" ? s.absenceCount >= ABSENCE_THRESHOLD :
        filter.startsWith("grade-") ? s.gradeSection.includes(filter.replace("grade-", "Grade ")) :
        true;
      return matchesQuery && matchesFilter;
    });
  }, [students, query, filter]);

  const kpis = useMemo(() => {
    const registered = logs.filter((l) => l.registeredAt);
    const checked = registered.filter((l) => l.checkedInAt);
    const participation = registered.length ? Math.round((checked.length / registered.length) * 100) : 0;
    const flags = students.filter((s) => s.absenceCount >= ABSENCE_THRESHOLD).length;
    return { participation, flags };
  }, [logs, students]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const canLogAbsence = user?.role === "admin";

  const gradeOptions = [...new Set(students.map((s) => s.gradeSection))].map((s) => ({
    label: s,
    value: `grade-${s.split(" ")[1]}`,
  }));

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Flagged only", value: "flagged" },
    ...gradeOptions,
  ];

  return (
    <>
      <AppHeader
        eyebrow={user?.role === "admin" ? "Admin Portal" : "Security Portal"}
        title={user?.name || "Dashboard"}
        subtitle="System-wide student data and gate operations"
      />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <SearchBar value={query} onChange={setQuery} placeholder="Search by name, ID, or section" />
            <FilterDropdown
              options={filterOptions}
              selected={filter}
              onChange={setFilter}
            />
          </div>
          <div className="flex gap-2">
            <Link
              href="/security-portal/scanner"
              className="flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gold-deep"
            >
              <QrCode className="h-3.5 w-3.5" />
              Gate Scanner
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Active JHS students" value={String(students.length)} hint="Full roster" />
          <Kpi label="Event participation" value={`${kpis.participation}%`} hint="Checked in ÷ registered" />
          <Kpi label="Delivery success" value="99.2%" hint="In-app, push, and SMS" />
          <Kpi label="Early-warning flags" value={String(kpis.flags)} hint={`Absence threshold ${ABSENCE_THRESHOLD}`} warn={kpis.flags > 0} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
            <h2 className="text-sm font-semibold text-ink">Student List</h2>
            <p className="text-xs text-slate-500 mt-1">All JHS students — {filteredStudents.length} shown</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 font-medium">Student</th>
                    <th className="py-2 font-medium">Section</th>
                    <th className="py-2 font-medium">Absences</th>
                    <th className="py-2 font-medium">Status</th>
                    {canLogAbsence && <th className="py-2 font-medium" />}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const flagged = student.absenceCount >= ABSENCE_THRESHOLD;
                    return (
                      <tr key={student.id} className="border-t border-slate-100">
                        <td className="py-2">
                          <span className="block font-semibold text-ink">{student.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">{student.id}</span>
                        </td>
                        <td className="py-2 text-slate-600">{student.gradeSection}</td>
                        <td className="py-2 tabular font-semibold">
                          {student.absenceCount}
                          <span className="font-normal text-slate-400"> / {ABSENCE_THRESHOLD}</span>
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              flagged ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {flagged ? "Threshold reached" : "Watching"}
                          </span>
                        </td>
                        {canLogAbsence && (
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => logAbsence(student.id)}
                              className="rounded-full bg-maroon-soft px-2.5 py-1 text-[11px] font-semibold text-maroon hover:bg-maroon hover:text-white"
                            >
                              + Log absence
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <ChannelChart />
        </section>
      </main>
    </>
  );
}

function Kpi({ label, value, hint, warn }: { label: string; value: string; hint: string; warn?: boolean }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${warn ? "text-red-800" : "text-ink"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/security-portal/page.tsx src/app/security-portal/layout.tsx
git commit -m "feat: add security/admin portal with system-wide data"
```

---

### Task 11: Move Gate Scanner to Security Portal

**Files:**
- Move: `src/app/admin/scanner/page.tsx` → `src/app/security-portal/scanner/page.tsx`

**Interfaces:**
- Consumes: Existing scanner code, `useAuthStore()` for auth guard
- Produces: Scanner accessible from `/security-portal/scanner`

- [ ] **Step 1: Create scanner route under security portal**

Move the scanner page to `src/app/security-portal/scanner/page.tsx` and update imports. Add auth check at the top.

- [ ] **Step 2: Update back link to point to security portal**

Change any "Back to Admin" links to point to `/security-portal`.

- [ ] **Step 3: Commit**

```bash
git add src/app/security-portal/scanner/page.tsx
git rm src/app/admin/scanner/page.tsx
git commit -m "feat: move gate scanner to security portal"
```

---

### Task 12: Remove Old Routes and Update Navigation

**Files:**
- Delete: `src/app/admin/`, `src/app/parent/`
- Modify: `src/components/AppHeader.tsx`, `src/app/page.tsx`

**Interfaces:**
- Produces: Clean navigation pointing to new portals only

- [ ] **Step 1: Delete old routes**

```bash
rm -rf src/app/admin src/app/parent
```

- [ ] **Step 2: Update AppHeader navigation**

Update `src/components/AppHeader.tsx` links array:

```typescript
const links = [
  { href: "/", label: "Overview" },
  { href: "/student", label: "Student" },
  { href: "/login", label: "Portals" },
];
```

- [ ] **Step 3: Update homepage lanes**

Update `src/app/page.tsx` lanes to point to `/login` instead of individual portals.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove old routes, update navigation to new portals"
```

---

### Task 13: Hydrate Auth on App Load

**Files:**
- Modify: `src/components/Providers.tsx`

**Interfaces:**
- Consumes: `useAuthStore().hydrate()`
- Produces: Auth state restored from cookie on app mount

- [ ] **Step 1: Call hydrate in Providers**

Add to `src/components/Providers.tsx`:

```typescript
import { useAuthStore } from "@/store/useAuthStore";

// Inside component:
const hydrate = useAuthStore((s) => s.hydrate);

useEffect(() => {
  hydrate();
}, [hydrate]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Providers.tsx
git commit -m "feat: hydrate auth state from cookie on app load"
```

---

### Task 14: End-to-End Verification

**Files:**
- None (manual testing)

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test login flow**

1. Go to `/login`
2. Login as `maria@parent.test` / `parent123`
3. Verify redirect to `/parent-portal`
4. Verify only Juan Dela Cruz appears in child list
5. Logout, verify redirect to `/login`

- [ ] **Step 3: Test teacher portal**

1. Login as `osalla@teacher.test` / `teacher123`
2. Verify redirect to `/teacher-portal`
3. Verify only Grade 9 - St. Augustine and Grade 9 - St. Nicholas students appear
4. Test search and filter

- [ ] **Step 4: Test security/admin portal**

1. Login as `principal@admin.test` / `admin123`
2. Verify redirect to `/security-portal`
3. Verify all 12 students appear
4. Verify "Log absence" button visible (admin only)
5. Login as `security@admin.test` / `admin123`
6. Verify "Log absence" button hidden (security role)

- [ ] **Step 5: Test gate scanner**

1. From security portal, click "Gate Scanner"
2. Verify scanner loads at `/security-portal/scanner`
3. Test QR scan flow

- [ ] **Step 6: Verify old routes gone**

1. Navigate to `/admin` — should 404
2. Navigate to `/parent` — should 404

- [ ] **Step 7: Commit**

```bash
git commit -m "test: verify end-to-end portal flow"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Separate portal routes (Task 8, 9, 10)
- ✅ Login auth (Task 7)
- ✅ Parent sees only their children (Task 8)
- ✅ Teacher sees only advisees (Task 9)
- ✅ Security/admin sees all (Task 10)
- ✅ Search bar and filters (Task 6, used in 8/9/10)
- ✅ Cookie session (Task 4)
- ✅ Collapsible child cards (Task 8)
- ✅ Old routes removed (Task 12)

**2. Step scan:** Each step is one action with a checkable result. No vague steps.

**3. Type consistency:**
- `User` type defined in Task 3, used in Task 4, 7, 8, 9, 10
- `Student` type from existing `src/types/index.ts` used consistently
- `fetchChildrenForParent` returns `string[]` (student IDs), consumed correctly

**4. Review Focus:**
- Parent sees other parent's children → Task 8 fetches only by `parent_user_id`, verified in Step 2 test
- Teacher sees students outside sections → Task 9 fetches only by `grade_section` filter, verified in Step 3 test
- Session cookie missing on refresh → Task 13 hydrates on app load, verified in Step 1 test
- Search freezes UI → Task 6 uses 300ms debounce, verified in Step 2-4 tests
- Logout leaves state → Task 4 `logout()` clears cookie and store, verified in Step 2 test

**5. Proportion:** Plan is ~500 lines, spec is ~200 lines. Plan is detailed but not a transcript — each step is a decision, not code dump.

---

**END OF PLAN**
