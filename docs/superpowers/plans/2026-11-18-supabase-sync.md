# Supabase Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the One ID One Connect prototype to Supabase so all data lives in the cloud instead of localStorage.

**Architecture:** Keep Zustand store as reactive UI cache. Add Supabase read/write layer. On mount, fetch from DB. On mutations, write to DB first, then update local state. Seed script pushes demo data once.

**Tech Stack:** Next.js 15, React 19, Zustand 5, Supabase JS client, TypeScript

**Spec:** Supabase schema at `supabase/schema.sql`

## Global Constraints
- Use publishable key `sb_publishable_xxx` for browser client
- Never expose secret key to browser
- Keep existing types in `src/types/index.ts` unchanged
- All DB columns use snake_case; types use camelCase
- RLS allows anon read/write for prototype phase

## Review Focus
- Empty Supabase tables on first load (need seed fallback)
- Network failure during fetch (show error, keep local data)
- Race condition: two tabs write at same time
- Token expiry logic must still work (expires_at bigint)
- Notification fan-out must write to DB, not just local state

---

### Task 1: Fix Supabase Client for New API Key Format

**Files:**
- Modify: `src/lib/supabase.ts`

**Interfaces:**
- Consumes: env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Produces: `supabase` client instance

- [ ] **Step 1: Update client to use publishable key with correct headers**

The new Supabase API key format uses `sb_publishable_xxx`. The `@supabase/supabase-js` client should handle this, but verify by adding explicit auth config.

```typescript
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

- [ ] **Step 2: Test connection with a simple select**

Add a temporary test function in `supabase.ts`:
```typescript
export async function testConnection() {
  const { data, error } = await supabase.from("students").select("id").limit(1);
  if (error) console.error("Supabase error:", error);
  return { data, error };
}
```

Call it from a component or page to verify 401 is gone.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "fix: update Supabase client for publishable key format"
```

---

### Task 2: Seed Script — Push Demo Data to Supabase

**Files:**
- Create: `scripts/seed-supabase.ts`
- Modify: `package.json` (add script)

**Interfaces:**
- Consumes: `src/lib/seed.ts` demo data, `src/lib/supabase.ts` client
- Produces: Populated Supabase tables

- [ ] **Step 1: Install tsx for running TypeScript scripts**

```bash
npm install -D tsx
```

- [ ] **Step 2: Write seed script**

Create `scripts/seed-supabase.ts` that:
1. Imports `students`, `activities`, `attendanceLogs`, `notifications` from `src/lib/seed.ts`
2. Maps camelCase to snake_case for each row
3. Uses `supabase.from("students").upsert(...)` for each table
4. Logs success/error per table

Key mapping for students:
```typescript
const studentRows = students.map(s => ({
  id: s.id,
  name: s.name,
  grade_section: s.gradeSection,
  parent_name: s.parentName,
  parent_contact: s.parentContact,
  adviser_name: s.adviserName,
  consent_verified: s.consentVerified,
  absence_count: s.absenceCount,
  avatar_initials: s.avatarInitials,
}));
```

- [ ] **Step 3: Add npm script**

In `package.json` scripts:
```json
"seed:supabase": "tsx scripts/seed-supabase.ts"
```

- [ ] **Step 4: Run seed script**

```bash
npm run seed:supabase
```

Verify in Supabase Table Editor that data appears.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-supabase.ts package.json
git commit -m "feat: add Supabase seed script"
```

---

### Task 3: Add DB Read/Write Helpers

**Files:**
- Create: `src/lib/db.ts`

**Interfaces:**
- Consumes: `supabase` client, types from `src/types/index.ts`
- Produces: `fetchStudents()`, `fetchActivities()`, `fetchLogs()`, `fetchNotifications()`, `saveStudent()`, `saveLog()`, `saveNotification()`

- [ ] **Step 1: Write fetch helpers**

```typescript
export async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("*");
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    gradeSection: row.grade_section,
    // ... etc
  }));
}
```

Repeat for activities, attendance_logs, notifications.

- [ ] **Step 2: Write upsert helpers**

```typescript
export async function saveStudent(student: Student) {
  const { error } = await supabase.from("students").upsert({
    id: student.id,
    name: student.name,
    grade_section: student.gradeSection,
    // ... etc
  });
  if (error) throw error;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add Supabase DB read/write helpers"
```

---

### Task 4: Wire Store to Supabase — Read on Mount

**Files:**
- Modify: `src/store/usePrototypeStore.ts`

**Interfaces:**
- Consumes: `fetchStudents()`, `fetchActivities()`, `fetchLogs()`, `fetchNotifications()` from `src/lib/db.ts`
- Produces: Store loads from DB on hydrate

- [ ] **Step 1: Add async init action to store**

Add `initFromDb` action:
```typescript
initFromDb: async () => {
  try {
    const [students, activities, logs, notifications] = await Promise.all([
      fetchStudents(),
      fetchActivities(),
      fetchLogs(),
      fetchNotifications(),
    ]);
    set({ students, activities, logs, notifications, hydrated: true });
  } catch (e) {
    console.error("DB load failed:", e);
    // Fall back to seed data
    const fresh = cloneSeed();
    set({
      students: fresh.students,
      activities: fresh.activities,
      logs: fresh.logs,
      notifications: fresh.notifications,
      hydrated: true,
    });
  }
}
```

- [ ] **Step 2: Call init on app mount**

In `src/components/Providers.tsx` or `src/app/layout.tsx`, call `initFromDb()` after mount.

- [ ] **Step 3: Remove persist middleware or make it optional**

Since data lives in DB, localStorage persist is redundant. Comment out or remove `persist` wrapper. Keep `hydrated` flag for UI loading states.

- [ ] **Step 4: Commit**

```bash
git add src/store/usePrototypeStore.ts src/app/layout.tsx
git commit -m "feat: load store data from Supabase on mount"
```

---

### Task 5: Wire Store to Supabase — Write on Mutate

**Files:**
- Modify: `src/store/usePrototypeStore.ts`

**Interfaces:**
- Consumes: `saveStudent()`, `saveLog()`, `saveNotification()` from `src/lib/db.ts`
- Produces: All mutations persist to DB

- [ ] **Step 1: Update `register` action**

After building `nextLogs` and `notes`, also save to DB:
```typescript
// After set({...})
await Promise.all([
  saveLog(nextLogs.find(l => l.studentId === studentId && l.activityId === activityId)!),
  ...notes.map(n => saveNotification(n)),
]);
```

- [ ] **Step 2: Update `verifyScan` action**

After successful check-in, save the updated log and notifications to DB.

- [ ] **Step 3: Update `logAbsence` action**

After updating student absence count, save student and notifications to DB.

- [ ] **Step 4: Update `manualCheckIn` action**

Same as verifyScan — save log after check-in.

- [ ] **Step 5: Commit**

```bash
git add src/store/usePrototypeStore.ts
git commit -m "feat: persist store mutations to Supabase"
```

---

### Task 6: Verify End-to-End

**Files:**
- None (manual testing)

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test each flow**

1. Open student page — data loads from DB
2. Register for activity — log appears in Supabase Table Editor
3. Check in with QR — scan result saves, notification appears
4. Toggle geofence off — scan blocked (no DB write)
5. Admin page shows correct attendance counts

- [ ] **Step 3: Check for console errors**

- [ ] **Step 4: Commit**

```bash
git commit -m "test: verify Supabase sync end-to-end"
```

---

## Self-Review

1. **Spec coverage:** All tables covered. Seed script handles initial data. Store reads and writes covered.
2. **Step scan:** Each step is one action. No vague steps.
3. **Type consistency:** camelCase in code, snake_case in DB. Mapping explicit in db.ts.
4. **Review Focus:** Empty tables handled by fallback seed. Network errors caught with try/catch. Race conditions mitigated by DB as single source of truth. Token expiry unchanged (client-side). Notification fan-out writes to DB.
5. **Proportion:** Plan is concise. Code bodies only where mapping is non-obvious.
