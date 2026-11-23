# Student Portal Auth & Login Button — Short Design Doc

**Date:** 2026-11-23  
**Status:** Approved by user (Approach 1)

---

## Intent and Why
Currently, students access `/student` directly without authentication, and the page is hardcoded to Juan Dela Cruz (`USA-JHS-2026-0104`). Furthermore, the top navigation displays a "Portals" button which should be simplified to "Login".

This feature adds student authentication to the unified `/login` flow (supporting both Student ID and Email), personalizes `/student` to whichever student is signed in, protects the route with an auth guard, adds a Sign Out action, and updates the header navigation link from "Portals" to "Login".

---

## Goals & Anti-Goals
### Goals:
1. Allow students to sign in using their **Student ID** (e.g., `USA-JHS-2026-0104`) or **Email** (e.g., `juan@student.test`) with default demo password `student123`.
2. Update `UserRole` in `src/types/index.ts` to include `"student"`.
3. Seed demo student user credentials in `scripts/seed-users.ts` and in fallback mock auth.
4. Protect `/student` route with auth guard: redirect to `/login` if not authenticated or if user is not a student.
5. Personalize `/student` to display the authenticated student's Digital ID, rotating 30s dynamic QR code, absences, registrations, and notifications.
6. Add "Sign out" button to the student page header.
7. Update `AppHeader.tsx` navigation: change "Portals" tab to "Login", remove public "Student" link so all non-home traffic routes through Login.

### Anti-Goals:
- Do not break existing Parent, Teacher, Admin, or Security portal logins.
- Do not modify student registration logic or QR code generation algorithms.

---

## Approaches Considered
- **Approach 1 (Chosen):** Dual login (Email or Student ID) + Dynamic `/student` portal. Supports entering either Student ID or email, keeps `/student` URL, renames "Portals" to "Login".
- **Approach 2:** Separate `/student-portal` with email-only login. Rejected because student ID is the core identifier in this school system.
- **Approach 3:** Segmented student vs staff tabbed login interface. Rejected as unnecessary complexity when dual input works smoothly.

---

## Design Specifications

### 1. Types (`src/types/index.ts`)
- `export type UserRole = "student" | "parent" | "teacher" | "security" | "admin";`
- Add optional `studentId?: string` to `User` interface.

### 2. Auth Store & Fallbacks (`src/store/useAuthStore.ts`)
- Update `login(identifier, password)` to check both `email = identifier` and `studentId = identifier` (or match against student IDs in seeded roster).
- When a student signs in, set `role: "student"` and `user.studentId = student.id`.

### 3. Student Portal (`src/app/student/page.tsx` & layout)
- Add auth guard checking `isAuthenticated` and `user?.role === "student"`.
- Retrieve active student by `user.studentId` (falling back gracefully).
- Add "Sign out" button in `AppHeader` or top right action bar.

### 4. Navigation & Homepage (`src/components/AppHeader.tsx`, `src/app/page.tsx`)
- In `AppHeader.tsx`:
  ```typescript
  const links = [
    { href: "/", label: "Overview" },
    { href: "/login", label: "Login" },
  ];
  ```
- In `src/app/page.tsx`:
  - Update "Open Juan's ID" button and student lane card to direct to `/login` with hint/auto-fill or direct to `/login`.

---

**END OF DESIGN DOC**
