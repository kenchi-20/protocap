# Student Portal Auth & Login Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable student authentication via Student ID or Email, personalize the Student Portal to the authenticated student with a rotating dynamic QR code and sign-out button, protect the `/student` route, and rename the navigation button from "Portals" to "Login".

**Architecture:** Extend `UserRole` to include `"student"` and add `studentId` to the `User` model. Update `useAuthStore` to support login by either email or Student ID. Add auth guard to `/student` layout and bind the page to the authenticated student. Update `AppHeader.tsx` and homepage navigation links.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zustand 5, Playwright E2E

**Spec:** `docs/superpowers/specs/2026-11-23-student-portal-and-login-design.md`

## Global Constraints
- Preserve existing logins for parents, teachers, security, and admin.
- Support demo student password `student123`.
- Any student ID from the seeded roster (e.g. `USA-JHS-2026-0104`, `USA-JHS-2026-0088`, etc.) or email can log in.
- Passwords stored in plain text for demo prototype only.
- All tests must pass: `npm run build` and `npm run test:e2e`.

## Review Focus
1. Non-student accessing `/student` — verify layout redirects to `/login`.
2. Student login redirect — verify student redirected to `/student` upon signing in.
3. Personalized student view — verify QR code, ID badge, and absences reflect the logged-in student, not hardcoded Juan Dela Cruz.
4. Sign out on student page — verify session is cleared and redirects to `/login`.
5. Navigation link — verify header shows "Overview" and "Login" (not "Portals").

---

### Task 1: Add "student" to UserRole & studentId to User Interface

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `UserRole` with `"student"` option, `User` interface with `studentId?: string`

- [ ] **Step 1: Update `src/types/index.ts`**
Add `"student"` to `UserRole` and `studentId?: string` to `User`:
```typescript
export type UserRole = "student" | "parent" | "teacher" | "security" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  studentId?: string;
}
```

- [ ] **Step 2: Verify typechecking**
Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**
```bash
git add src/types/index.ts
git commit -m "feat: add student to UserRole and studentId to User interface"
```

---

### Task 2: Update Auth Store & Seed Script for Student Login

**Files:**
- Modify: `src/store/useAuthStore.ts`
- Modify: `scripts/seed-users.ts`

**Interfaces:**
- Consumes: `User`, `UserRole`, `students` from `src/lib/seed.ts`
- Produces: `login(identifier, password)` accepting either student ID or email, with fallback mapping to seeded students

- [ ] **Step 1: Update `scripts/seed-users.ts`**
Add demo student accounts for seeded students (`juan@student.test`, etc.) with role `"student"` and `studentId`.

- [ ] **Step 2: Update `src/store/useAuthStore.ts`**
In `login(identifier, password)`:
- Support identifier matching `email` or `studentId` (or matching against seeded students if identifier is a student ID like `USA-JHS-2026-0104`).
- For student logins, set `user: { id, email, role: "student", name, studentId }`.
- Save session cookie and set state.

- [ ] **Step 3: Verify build and typecheck**
Run: `npm run build`
Expected: Success

- [ ] **Step 4: Commit**
```bash
git add src/store/useAuthStore.ts scripts/seed-users.ts
git commit -m "feat: support student login by student ID or email in auth store"
```

---

### Task 3: Protect and Personalize Student Portal

**Files:**
- Create: `src/app/student/layout.tsx`
- Modify: `src/app/student/page.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `usePrototypeStore`
- Produces: Dynamic student portal with auth protection and sign-out button

- [ ] **Step 1: Create `src/app/student/layout.tsx`**
Add auth guard:
```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "student")) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "student") {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Update `src/app/student/page.tsx`**
- Replace hardcoded `DEMO_STUDENT_ID` with `user?.studentId || DEMO_STUDENT_ID`.
- Add Sign Out button in the header calling `logout()` and `router.push("/login")`.
- Dynamic QR, absences, and registrations bind to the authenticated student's ID.

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: 0 errors

- [ ] **Step 4: Commit**
```bash
git add src/app/student/layout.tsx src/app/student/page.tsx
git commit -m "feat: add auth guard and personalization to student portal"
```

---

### Task 4: Update Navigation, Homepage, and Login Page

**Files:**
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Produces: Header displaying "Overview" and "Login", login redirecting students to `/student`

- [ ] **Step 1: Update `src/components/AppHeader.tsx`**
Change links array:
```typescript
const links = [
  { href: "/", label: "Overview" },
  { href: "/login", label: "Login" },
];
```

- [ ] **Step 2: Update `src/app/login/page.tsx`**
- In `handleSubmit`:
  ```typescript
  if (user?.role === "student") router.push("/student");
  else if (user?.role === "parent") router.push("/parent-portal");
  else if (user?.role === "teacher") router.push("/teacher-portal");
  else router.push("/security-portal");
  ```
- Change input label from "Email" to "Email or Student ID".
- Update demo credentials hint to include: `juan@student.test (or USA-JHS-2026-0104) / student123`.

- [ ] **Step 3: Update `src/app/page.tsx`**
Update links on homepage lanes:
- Student lane: directs to `/login` (or `/student` which guards to `/login` if unauthenticated).

- [ ] **Step 4: Verify build**
Run: `npm run build`
Expected: Clean build

- [ ] **Step 5: Commit**
```bash
git add src/components/AppHeader.tsx src/app/page.tsx src/app/login/page.tsx
git commit -m "feat: change portals tab to login and support student redirect"
```

---

### Task 5: End-to-End Tests for Student Portal & Verification

**Files:**
- Modify: `e2e/portals.spec.ts`

**Interfaces:**
- Produces: E2E test suite covering student login, ID access, QR rendering, and navigation checks

- [ ] **Step 1: Add student portal E2E test in `e2e/portals.spec.ts`**
- Test student login with Student ID (`USA-JHS-2026-0104`) and verify redirect to `/student`.
- Test that student name, digital ID, and dynamic QR are rendered.
- Test sign-out flow returning to `/login`.
- Test that unauthenticated access to `/student` redirects to `/login`.
- Verify header contains "Login" link instead of "Portals".

- [ ] **Step 2: Run all E2E tests**
Run: `npm run test:e2e`
Expected: All tests pass (5/5)

- [ ] **Step 3: Run production build**
Run: `npm run build`
Expected: Clean build, 0 warnings

- [ ] **Step 4: Commit**
```bash
git add e2e/portals.spec.ts
git commit -m "test: add E2E tests for student login and portal verification"
```

---

## Self-Review

1. **Spec coverage:**
   - Student ID or email login: covered in Task 2 & Task 4.
   - Dynamic QR and personalized student portal: covered in Task 3.
   - Protect `/student` route: covered in Task 3.
   - Change "Portals" to "Login": covered in Task 4.
   - Sign out button on student view: covered in Task 3.
   - E2E tests: covered in Task 5.
2. **Review Focus:** All 5 focus areas are verified in Task 5.
3. **Step granularity:** Each task has actionable steps with checkable outcomes.
