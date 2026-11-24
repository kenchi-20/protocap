# UI & Interaction Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the prototype's user experience across all portals by implementing tactile button and card press states, sticky translucent frosted headers, fluid sliding tab indicators with Framer Motion, smooth animated disclosures in the parent portal, centered spring modal entrances with backdrop blur, and synchronized countdown transitions.

**Architecture:** Utilize existing Framer Motion and Tailwind CSS foundations. Introduce physical spring configurations, `layoutId` layout animations for tab switching, `<AnimatePresence>` height transitions for expanding accordions, and `active:scale-[0.97]` tactile press feedback without mutating data structures or backend logic.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, Framer Motion 12, TypeScript, Playwright E2E

**Spec:** `docs/superpowers/specs/2026-11-24-ui-polish-design.md`

## Global Constraints
- Preserve all existing auth flows, user roles, and data stores (`useAuthStore`, `usePrototypeStore`).
- Only animate `transform` and `opacity` where possible to keep motion on the compositor thread.
- Spring animations for UI interactions must stay under 400ms duration with subtle bounce (bounce <= 0.15).
- Maintain responsiveness across mobile and desktop viewports.
- All builds and tests must pass: `npm run build` and `npm run test:e2e`.

## Review Focus
1. **Button press responsiveness:** Pressing interactive buttons should visibly compress on `:active` with `scale-[0.97]`.
2. **Tab transition smoothness:** Switching between tabs on `/student` should smoothly slide the pill background using Framer Motion `layoutId`.
3. **Parent portal disclosure:** Expanding/collapsing student rows should smoothly animate height and opacity without content snapping.
4. **Sticky header behavior:** When scrolling on any portal, `AppHeader` should remain sticky at `top-0` with `backdrop-blur-md` and frosted background.
5. **Modal depth and entrance:** Opening `Student360Modal` should blur the background backdrop and scale in from center (`scale: 0.96` to `1`).

---

### Task 1: Button & Card Press States, Input Focus Rings, and Global CSS

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/SearchBar.tsx`
- Modify: `src/components/FilterDropdown.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Produces: Global tactile button classes, refined search/filter focus rings, and card active states.

- [ ] **Step 1: Update `src/app/globals.css`**
Add smooth press feedback utilities and input focus styling:
```css
/* Button & interactive press utilities */
.btn-press {
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease, opacity 150ms ease;
}
.btn-press:active {
  transform: scale(0.97);
}

/* Tabular figures for clocks and statistics */
.tabular {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Update `src/components/SearchBar.tsx` & `src/components/FilterDropdown.tsx`**
In `src/components/SearchBar.tsx`:
- Upgrade input styling to:
  `className="w-full rounded-full border border-slate-200 py-2 pl-10 pr-10 text-sm outline-none transition-all duration-150 focus:border-maroon focus:ring-2 focus:ring-maroon/15"`
- Add `active:scale-90 transition-transform` on the clear button (`X`).

In `src/components/FilterDropdown.tsx`:
- Upgrade `<select>` to:
  `className="rounded-full border border-slate-200 px-3 py-1.5 text-sm outline-none transition-all duration-150 focus:border-maroon focus:ring-2 focus:ring-maroon/15 cursor-pointer"`

- [ ] **Step 3: Update `src/app/page.tsx` & `src/app/login/page.tsx`**
In `src/app/page.tsx`:
- On the primary button "Open Juan's ID": add `active:scale-[0.97] transition-all duration-150 ease-out`.
- On the 4 lane cards: update `transition hover:-translate-y-0.5` to:
  `transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99] active:shadow-sm`

In `src/app/login/page.tsx`:
- Add focus rings to identifier and password inputs:
  `className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-maroon focus:ring-2 focus:ring-maroon/15"`
- Add `active:scale-[0.98] transition-transform duration-150` on the "Sign in" submit button.
- Add `active:scale-[0.97] transition-all duration-150` on the 4 Quick Fill demo account cards.

- [ ] **Step 4: Verify build**
Run: `npm run build`
Expected: Success with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add src/app/globals.css src/components/SearchBar.tsx src/components/FilterDropdown.tsx src/app/page.tsx src/app/login/page.tsx
git commit -m "polish: add tactile press states and focus rings to inputs, cards, and buttons"
```

---

### Task 2: Sticky Translucent Navigation Header

**Files:**
- Modify: `src/components/AppHeader.tsx`

**Interfaces:**
- Produces: Sticky, frosted header with backdrop blur and fluid navigation links.

- [ ] **Step 1: Update `src/components/AppHeader.tsx`**
Update header container and navigation items:
```tsx
export function AppHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-maroon/10 bg-white/85 shadow-sm/5 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-maroon">{eyebrow}</p>}
            <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 max-w-xl text-sm text-slate-600">{subtitle}</p>}
          </div>
          <p className="text-xs font-medium text-slate-500">University of San Agustin · Junior High</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-0.5">
          {links.map((link) => {
            const active = link.href === "/" ? path === "/" : path === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                  active ? "bg-maroon text-white shadow-sm" : "text-slate-600 hover:bg-maroon-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify build**
Run: `npm run build`
Expected: Success with 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/AppHeader.tsx
git commit -m "polish: upgrade AppHeader to sticky translucent backdrop-blur design"
```

---

### Task 3: Fluid Sliding Tab Indicator in Student Portal

**Files:**
- Modify: `src/app/student/page.tsx`

**Interfaces:**
- Produces: Framer Motion `layoutId="activeTabPill"` animated tab switch, tactile registration button.

- [ ] **Step 1: Update Tabs in `src/app/student/page.tsx`**
Replace the static tab bar with layout-animated pill buttons:
```tsx
<div className="flex gap-1 rounded-full bg-white p-1 shadow-card">
  {tabs.map((item) => {
    const isActive = tab === item;
    return (
      <button
        key={item}
        type="button"
        onClick={() => setTab(item)}
        className="relative flex-1 rounded-full px-3 py-2 text-xs font-semibold sm:text-sm text-slate-600 transition-colors duration-200 active:scale-95"
      >
        {isActive && (
          <motion.div
            layoutId="activeTabPill"
            className="absolute inset-0 rounded-full bg-maroon shadow-sm"
            transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
          />
        )}
        <span className={`relative z-10 transition-colors duration-200 ${isActive ? "text-white" : "hover:text-ink"}`}>
          {item}
        </span>
      </button>
    );
  })}
</div>
```

- [ ] **Step 2: Add tactile press feedback to action buttons in `StudentPage`**
- "Sign out" button:
  `className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-200 active:scale-95"`
- "One-tap register" button:
  `className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
    done ? "bg-emerald-50 text-emerald-800" : "bg-gold text-ink hover:bg-gold-deep hover:text-white active:scale-95"
  }`}`

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: Success with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add src/app/student/page.tsx
git commit -m "polish: implement fluid Framer Motion layoutId tab indicator on student portal"
```

---

### Task 4: Animated Student Accordions in Parent Portal

**Files:**
- Modify: `src/app/parent-portal/page.tsx`

**Interfaces:**
- Produces: Framer Motion animated accordion disclosure with rotating chevron.

- [ ] **Step 1: Update accordion disclosure in `src/app/parent-portal/page.tsx`**
Import `motion` and `AnimatePresence` from `framer-motion`.
Update the student row component to animate expansion and rotate chevron:
```tsx
<button
  type="button"
  onClick={() => toggleExpand(student.id)}
  className="w-full p-4 text-left flex items-center justify-between transition-colors duration-150 hover:bg-slate-50/50 active:bg-slate-100/50"
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
    <ChevronDown
      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ease-out ${
        isExpanded ? "rotate-180" : ""
      }`}
    />
  </div>
</button>

<AnimatePresence initial={false}>
  {isExpanded && (
    <motion.div
      key="content"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="border-t border-slate-100 p-4 space-y-3">
        {/* Child stats, recent activity, and SMS inbox */}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```
Also add `active:scale-95 transition-all duration-150` on the "Sign out" button.

- [ ] **Step 2: Verify build**
Run: `npm run build`
Expected: Success with 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/app/parent-portal/page.tsx
git commit -m "polish: add smooth animated height accordion and rotating chevron to parent portal"
```

---

### Task 5: Centered Spring Modal, QR Countdown Easing, and Demo Switcher Polish

**Files:**
- Modify: `src/components/Student360Modal.tsx`
- Modify: `src/components/DynamicStudentQR.tsx`
- Modify: `src/components/DemoSwitcherBar.tsx`
- Modify: `src/app/security-portal/page.tsx`
- Modify: `src/app/teacher-portal/page.tsx`

**Interfaces:**
- Produces: Physical spring modal entrance with backdrop blur, smooth countdown ring sync, and tactile portal buttons.

- [ ] **Step 1: Polish `Student360Modal.tsx`**
In `src/components/Student360Modal.tsx`:
- Backdrop: add `backdrop-blur-sm bg-ink/40 transition-opacity duration-200`.
- Dialog card: replace `initial={{ y: 24, opacity: 0 }}` with:
  ```tsx
  <motion.div
    initial={{ scale: 0.96, opacity: 0, y: 12 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.96, opacity: 0, y: 8 }}
    transition={{ type: "spring", bounce: 0.08, duration: 0.35 }}
    onClick={(e) => e.stopPropagation()}
    className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-paper shadow-float sm:rounded-3xl"
  >
  ```
- Close button: add `active:scale-90 transition-transform duration-150`.

- [ ] **Step 2: Polish `DynamicStudentQR.tsx`**
In `src/components/DynamicStudentQR.tsx`:
- Update progress ring transition to linearly match the 250ms tick:
  `transition={{ duration: 0.25, ease: "linear" }}`
- Add `active:scale-95 transition-transform duration-150` to "Simulate expired screenshot" and "Restore live QR" buttons.

- [ ] **Step 3: Polish `DemoSwitcherBar.tsx`**
In `src/components/DemoSwitcherBar.tsx`:
- Add spring transition to expanding bar:
  `transition={{ type: "spring", bounce: 0.12, duration: 0.35 }}`
- Add `active:scale-95 transition-transform duration-150` to role switch buttons and reset button.

- [ ] **Step 4: Polish `SecurityPortalPage` and `TeacherPortalPage`**
Add `active:scale-95 transition-all duration-150` on "+ Log absence", "Gate Scanner", and "Sign out" buttons.

- [ ] **Step 5: Verify build**
Run: `npm run build`
Expected: Clean build with 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/components/Student360Modal.tsx src/components/DynamicStudentQR.tsx src/components/DemoSwitcherBar.tsx src/app/security-portal/page.tsx src/app/teacher-portal/page.tsx
git commit -m "polish: upgrade modal to spring scale entrance and refine QR timer and action buttons"
```

---

### Task 6: End-to-End Verification

**Files:**
- Run: `e2e/portals.spec.ts`

**Interfaces:**
- Produces: Verified complete suite passing without regressions.

- [ ] **Step 1: Run all E2E tests**
Run: `npm run test:e2e`
Expected: All 6 tests pass without error.

- [ ] **Step 2: Run production build check**
Run: `npm run build`
Expected: Clean build, 0 TypeScript errors.

- [ ] **Step 3: Commit final verification**
```bash
git commit --allow-empty -m "chore: verify UI and interaction polish with passing E2E tests"
```

---

## Self-Review

1. **Spec coverage:**
   - Tactile button & card press feedback: Task 1, Task 2, Task 3, Task 4, Task 5.
   - Sticky translucent headers with backdrop-blur: Task 2.
   - Fluid tab sliding indicator (`layoutId`): Task 3.
   - Animated accordions in Parent Portal: Task 4.
   - Centered spring modal with backdrop blur: Task 5.
   - Synchronized countdown progress ring: Task 5.
   - Focus rings & tabular numbers: Task 1.
2. **Review Focus:** All 5 review focus items are addressed and verified.
3. **Granularity & Deliverables:** Each task touches designated files and tests build cleanliness.
