# UI & Interaction Polish Design Doc — Short Design

**Date:** 2026-11-24  
**Status:** Approved by user (Approach 1: Targeted Component Polish with Framer Motion & Tailwind)

---

## Intent and Why
While the prototype's core features (dynamic QR, multi-role auth, attendance logs, early-warning alerts) are fully functional, the interface lacks the tactile feedback, fluid motion continuity, and visual layering (glassmorphism, active press states, smooth disclosures) that make software feel alive and premium ("beauty is leverage", Apple's fluid interfaces & Emil's design engineering principles).

This polish pass upgrades micro-interactions, layout transitions, button tactile feedback, sticky navigation headers, modal entry, and data rendering across all portals without altering data logic or state stores.

---

## Goals & Anti-Goals
### Goals:
1. **Tactile Button & Card Feedback:** Add `active:scale-[0.97]` and `transition-transform duration-150 ease-out` to all interactive buttons and cards to kill perceived latency on pointer-down.
2. **Sticky Translucent Headers:** Upgrade `AppHeader` across portals to sticky (`sticky top-0 z-30 backdrop-blur-md bg-white/85`) with subtle border separation.
3. **Fluid Tab Transitions:** Use Framer Motion layout animations (`layoutId="activeTabPill"`) on tabs (e.g. Student portal tabs) for smooth sliding state indicators.
4. **Animated Accordions & Disclosures:** Add smooth height & opacity transitions to parent portal student cards when expanding/collapsing.
5. **Modal & Dialog Depth:** Upgrade `Student360Modal` with scale-in entrance (`scale: 0.96 -> 1`) and backdrop blur (`backdrop-blur-sm bg-ink/40`).
6. **Focus States & Typography:** Add soft focus rings (`focus:ring-2 focus:ring-maroon/15`) and tabular numerals (`tabular-nums`) on counts, dates, and timers to prevent layout jitter.

### Anti-Goals:
- Do not rewrite core state management or introduce external CSS frameworks.
- Do not modify backend authentication or database logic.

---

## Approaches Considered
- **Approach 1 (Chosen):** Targeted Component Polish with Framer Motion & Tailwind. High-impact micro-interactions, active press states, sticky frosted headers, layout pills, and smooth accordions.
- **Approach 2:** Full Design System Extraction. Overkill for prototype phase.
- **Approach 3:** CSS-only Pass. Misses motion fluidity (layout pills, animated heights, spring modals).

---

## Design Specifications

### 1. Button & Interactive Press States (`globals.css` / components)
- Add utility or inline classes for button active states: `active:scale-[0.97] transition-all duration-150 ease-out`.
- Prevent generic `transition: all` in favor of explicit `transition-transform duration-200 ease-out`.

### 2. Sticky Translucent Headers (`src/components/AppHeader.tsx`)
- `sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-maroon/10 shadow-sm/5`.

### 3. Student Portal Tabs (`src/app/student/page.tsx`)
- Wrap tab buttons and active background with Framer Motion `layoutId="activeTabPill"` for gliding pill effect.

### 4. Parent Portal Accordions (`src/app/parent-portal/page.tsx`)
- Animate expansion using Framer Motion `initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}`.

### 5. Student 360 Modal (`src/components/Student360Modal.tsx`)
- Backdrop: `backdrop-blur-sm bg-ink/40`.
- Modal box: `initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}`.

### 6. Focus Rings & Tabular Numbers (`src/app/globals.css`)
- Add `.tabular { font-variant-numeric: tabular-nums; }` where missing.
- Input focus rings: `focus:border-maroon focus:ring-2 focus:ring-maroon/15 outline-none transition-all duration-150`.

---

**END OF DESIGN DOC**
