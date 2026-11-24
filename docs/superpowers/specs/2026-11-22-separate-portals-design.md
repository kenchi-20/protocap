# Separate Portals for Parents, Teachers, and Security/Admin — Design Doc

**Date:** 2026-11-22  
**Author:** Claude (via superpowers:brainstorming)  
**Status:** Draft — awaiting approval

---

## Intent and Why

Build three **separate, role-specific portals** so that parents see only their children's data, teachers see only their advisees, and security/admin see system-wide oversight. Currently, `/parent` is hardcoded to one demo student, `/admin` is open to everyone, and there's no teacher portal at all.

**Why now:** The user wants parents to access only their specific children (not all students), teachers to have a dedicated view of their advisees, and security/admin to have a focused gate-scanning and oversight interface — plus login authentication and search/filter UI across all roles.

**Success criteria:**
- Parent logs in, sees only their own children's attendance/activities/notifications
- Teacher logs in, sees only students they advise
- Security/admin logs in, sees system-wide data + gate scanner
- Search bar and filters work on student/activity lists
- Auth gates each portal (demo username/password for prototype phase)

---

## Goals, Non-Goals, Anti-Goals

### Goals
1. **Role-based access control:** Parent sees only their children; teacher sees only advisees; admin sees all
2. **Separate portal routes:** `/parent-portal`, `/teacher-portal`, `/security-portal` (not shared tabs)
3. **Login authentication:** `/login` page that validates credentials and sets session
4. **Search + filters:** On student lists, activity lists, notification inboxes
5. **Multi-child support for parents:** A parent with 2+ children sees all of them
6. **Teacher advisee management:** Teacher sees class roster, absence counts, registration status

### Non-Goals
- Real Supabase Auth (use demo in-memory auth for now; Supabase Auth is a future phase)
- Role hierarchy (e.g., principal vs. teacher permissions — all teachers see their advisees equally)
- Student portal changes (keep `/student` working as-is for now)

### Anti-Goals (what would make this fail even if technically working)
- Parents see other people's children
- No way to log out or switch users
- Search/filters so slow they time out on 100+ students
- Auth credentials logged to console or stored in plain text

---

## Constraints

- **Tech stack:** Next.js 15 (App Router), React 19, Zustand 5, TypeScript, Tailwind, Supabase (already connected per `src/lib/supabase.ts`)
- **Existing code:** Keep `/student`, `/admin`, `/admin/scanner` working for demo purposes; new portals coexist alongside them
- **Data model:** 12 seeded students, each with `parentName`, `parentContact`, `adviserName` fields — no auth tables exist yet
- **Auth scope:** Demo only (in-memory user list, no Supabase Auth integration yet)
- **Performance:** Search must be client-side filtering (no backend search API yet)

---

## Approaches Considered

### Approach A: Extend current routes (`/parent`, `/admin` become role-aware)
- **Tradeoff:** Least code churn, but role-switching logic in one codebase gets tangled
- **Rejected:** User explicitly asked for "separate portals" — this keeps them mixed

### Approach B: Separate portal routes (`/parent-portal`, `/teacher-portal`, `/security-portal`)
- **Tradeoff:** Clean separation, some UI duplication, but each role has its own space
- **CHOSEN** — User picked this approach

### Approach C: Single portal shell with role-based tabs
- **Tradeoff:** Simplest code, but role-switching UI feels jarring and not "separate"
- **Rejected:** Doesn't deliver the "separate portal" experience

---

## Design — What Gets Built

### 1. Data Model Changes

#### New Tables (Supabase schema additions)
```sql
-- Users table: holds login credentials and role assignment
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- For demo: store plain password (NEVER in production)
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'security', 'admin')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-child link: maps parent user_id to student IDs
CREATE TABLE parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL, -- references students.id
  UNIQUE(parent_user_id, student_id)
);

-- Teacher-advisee link: maps teacher user_id to grade section
CREATE TABLE teacher_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  grade_section TEXT NOT NULL,
  UNIQUE(teacher_user_id, grade_section)
);
```

#### Seed Data for Demo Users
```typescript
// Demo users for testing
const demoUsers = [
  { 
    email: "maria@parent.test", 
    password: "parent123", 
    role: "parent", 
    name: "Mrs. Maria Dela Cruz",
    children: ["USA-JHS-2026-0104"] // Juan Dela Cruz
  },
  { 
    email: "paulo@parent.test", 
    password: "parent123", 
    role: "parent", 
    name: "Mr. Paulo Villanueva",
    children: ["USA-JHS-2026-0088"] // Andrea Mae
  },
  { 
    email: "osalla@teacher.test", 
    password: "teacher123", 
    role: "teacher", 
    name: "Ms. Rovilyn Osalla",
    sections: ["Grade 9 - St. Augustine"]
  },
  { 
    email: "bautista@teacher.test", 
    password: "teacher123", 
    role: "teacher", 
    name: "Mr. Carlo Bautista",
    sections: ["Grade 8 - St. Monica"]
  },
  { 
    email: "security@admin.test", 
    password: "admin123", 
    role: "security", 
    name: "Security Desk"
  },
  { 
    email: "principal@admin.test", 
    password: "admin123", 
    role: "admin", 
    name: "Principal Desk"
  },
];
```

### 2. Auth System (Demo Phase)

**Login flow:**
1. User visits `/login`
2. Enters email + password
3. System checks against `users` table (plain text password comparison for demo)
4. On success: store `userId`, `role`, `name` in Zustand auth store + session cookie
5. Redirect to role-specific portal:
   - `parent` → `/parent-portal`
   - `teacher` → `/teacher-portal`
   - `security` or `admin` → `/security-portal`

**Auth store (Zustand slice):**
```typescript
interface AuthState {
  userId: string | null;
  role: 'parent' | 'teacher' | 'security' | 'admin' | null;
  name: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}
```

**Route protection:** Each portal page checks `isAuthenticated` and `role` on mount; if not authorized, redirect to `/login`.

### 3. Portal Routes

#### `/login` — Login Page
- Email + password fields
- "Sign in" button
- Error message display (wrong credentials, no access)
- No registration flow (demo users are seeded)

#### `/parent-portal` — Parent Dashboard
**Who sees it:** Users with `role: 'parent'`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header: "Parent Portal — [Parent Name]" │
│ [My Children] [Notifications] [Logout]  │
├─────────────────────────────────────────┤
│ Search: [_______________] 🔍             │
│ Filters: [All Activities] [Flagged Only]│
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Juan Dela Cruz (USA-JHS-2026-0104)  │ │
│ │ Grade 9 - St. Augustine             │ │
│ │ Absences: 2/3  Attendance: 50%      │ │
│ │ [View Details]                       │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [Another child if parent has 2+]    │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Recent Notifications (SMS/In-App)       │
│ • Juan checked in at Science Fair       │
│ • Registration confirmed for Intramurals│
└─────────────────────────────────────────┘
```

**Data fetching:**
1. Fetch `parent_children` rows where `parent_user_id = userId`
2. Load student records for those `student_id`s
3. Load logs/notifications filtered by those student IDs

**Search/filter:** Client-side filter on student name, ID, activity title

#### `/teacher-portal` — Teacher Dashboard
**Who sees it:** Users with `role: 'teacher'`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header: "Teacher Portal — [Teacher Name]"│
│ [My Classes] [Absences] [Activities] [Logout] │
├─────────────────────────────────────────┤
│ Search: [_______________] 🔍             │
│ Filters: [Flagged Only] [Recent Activity]│
├─────────────────────────────────────────┤
│ Grade 9 - St. Augustine (12 students)   │
│ ┌─────────────────────────────────────┐ │
│ │ Name          | ID      | Absences  │ │
│ │ Juan Dela Cruz| 0104    | 2/3       │ │
│ │ Andrea Mae V. | 0088    | 0/3 ✓     │ │
│ │ Miguel Santos | 0117    | 1/3       │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Recent Activity Registrations           │
│ • Juan registered for Intramurals       │
│ • Andrea checked in at Science Fair     │
└─────────────────────────────────────────┘
```

**Data fetching:**
1. Fetch `teacher_sections` rows where `teacher_user_id = userId`
2. Load students where `gradeSection IN (those sections)`
3. Load logs/notifications for those students

**Search/filter:** Client-side filter on student name, ID, absence threshold reached

#### `/security-portal` — Security/Admin Dashboard
**Who sees it:** Users with `role: 'security'` or `role: 'admin'`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header: "Security Portal — [Name]"      │
│ [Overview] [Scanner] [Reports] [Logout] │
├─────────────────────────────────────────┤
│ Search: [_______________] 🔍             │
│ Filters: [All Students] [Flagged] [Grade]│
├─────────────────────────────────────────┤
│ KPIs: Participation 72% | Flags: 3      │
├─────────────────────────────────────────┤
│ Student List (All JHS)                  │
│ ┌─────────────────────────────────────┐ │
│ │ Name          | Section | Absences  │ │
│ │ Juan Dela Cruz| Gr9-Aug | 2/3       │ │
│ │ Sofia Ramirez | Gr8-Mon | 3/3 🚨    │ │
│ │ Gabriel Tan   | Gr10-Th | 4/3 🚨    │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [Open Gate Scanner] → /admin/scanner    │
└─────────────────────────────────────────┘
```

**Data fetching:**
1. Load **all** students (no filtering by parent/teacher)
2. Load all logs, notifications
3. System-wide KPIs

**Search/filter:** Client-side filter on name, ID, grade section, absence threshold

### 4. Search & Filter Implementation

**Search bar component (`SearchBar.tsx`):**
```typescript
interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}
```
- Debounced input (300ms delay before filtering)
- Clear button when non-empty

**Filter dropdown (`FilterDropdown.tsx`):**
```typescript
interface FilterOption {
  label: string;
  value: string;
}
interface FilterDropdownProps {
  options: FilterOption[];
  selected: string;
  onChange: (value: string) => void;
}
```
- Dropdown menu with options like "All", "Flagged Only", "Grade 7", "Grade 8", etc.

**Client-side filtering logic:**
```typescript
const filtered = students.filter(s => {
  const matchesQuery = 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.id.toLowerCase().includes(query.toLowerCase());
  
  const matchesFilter = 
    filter === 'all' ? true :
    filter === 'flagged' ? s.absenceCount >= ABSENCE_THRESHOLD :
    filter.startsWith('grade-') ? s.gradeSection.includes(filter.split('-')[1]) :
    true;
  
  return matchesQuery && matchesFilter;
});
```

### 5. Logout Flow

**Logout button** (in each portal's header):
1. Calls `authStore.logout()`
2. Clears `userId`, `role`, `name` from store
3. Clears session cookie
4. Redirects to `/login`

---

## What's Left to the Builder

1. **Supabase schema migration:** Builder must run the SQL to create `users`, `parent_children`, `teacher_sections` tables
2. **Seed script for users:** Builder must write/run a script to populate demo users
3. **UI polish:** Exact spacing, colors, animations — builder follows existing design system (maroon, gold, Tailwind classes from current pages)
4. **Error handling:** What happens if Supabase fetch fails? Builder decides fallback (show error toast, retry button, or fallback to empty state)
5. **Session persistence:** Use a simple cookie or Zustand persist? Builder picks (recommendation: httpOnly session cookie for security, but Zustand persist is fine for demo)
6. **Password hashing:** Demo uses plain text passwords for simplicity — builder must add a comment warning "NEVER in production" and note that Supabase Auth is the future

---

## Review Focus (for the builder-check)

1. **Parent can't see other parents' children** — verify filtering by `parent_user_id`
2. **Teacher can't see students outside their sections** — verify filtering by `teacher_sections`
3. **Search performance with 100+ students** — ensure debounced client-side filter doesn't freeze UI
4. **Auth session persists across page refresh** — verify cookie or Zustand persist works
5. **Logout clears all sensitive data** — verify no userId/role left in store or localStorage after logout
6. **Demo credentials never logged** — verify no `console.log(password)` in production code

---

## Anti-Patterns to Avoid

- **Role checks only on client side** — even for demo, prepare for server-side role checks (future RLS in Supabase)
- **Hardcoding demo user IDs in components** — use `authStore.userId` dynamically
- **No loading states** — show skeleton/spinner while fetching user data
- **Search on every keystroke without debounce** — will cause jank with 100+ rows
- **Plain text passwords in production** — this is demo-only; add loud warnings

---

## Decisions Locked In

1. **Session persistence:** Cookies (httpOnly for security)
2. **Multiple children for one parent:** One scrollable list with collapsible cards per child
3. **Teacher vs. Admin portal:** Same UI for both roles with permission checks (teacher sees absence logging but can't modify; admin can)
4. **Old routes:** Replace `/admin` and `/parent` entirely — new portals are the only entry point

---

**END OF DESIGN DOC**

This design is approved and ready for builder-check by a subagent.
