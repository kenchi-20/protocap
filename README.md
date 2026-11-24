# ONE ID, ONE CONNECT

**Unified Student Identity, Dynamic Attendance & Multi-Role Communication System**  
*Capstone Title-Defense Prototype for the University of San Agustin — Junior High School (USA-JHS), Iloilo City.*

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Tested-green?style=flat&logo=playwright)](https://playwright.dev/)

---

## 📌 Problem & Thesis Premise

Secondary schools commonly fragment student operations across disconnected channels: paper attendance slips, standalone event sign-ups, unmonitored gate check-ins, and delayed parent notices. When a student is late or absent, parents often do not find out until hours later.

**ONE ID, ONE CONNECT** anchors all academic and co-curricular interactions to a single Student ID (`USA-JHS-2026-0104` for Juan Dela Cruz). A single scan updates the student's record, checks campus geofence compliance, alerts the parent via SMS, updates the section adviser's roster, and logs participation onto the principal's early-warning dashboard.

---

## 🏛️ System Architecture & Portals

The application features dedicated, role-guarded views accessible via unified authentication or quick-switching demo personas:

| Portal | Route | Primary Persona | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Landing & Overview** | `/` | Public | System lanes overview, demo account credentials, student ID walkthrough |
| **Unified Sign-in** | `/login` | All Roles | Student ID or email login, quick-fill demo buttons, role-based auto-redirect |
| **Student Portal** | `/student` | Student (`Juan Dela Cruz`) | Digital ID badge, 30s rotating dynamic QR with live countdown ring, one-tap activity registration, history log |
| **Parent Portal** | `/parent-portal` | Parent (`Mrs. Maria Dela Cruz`) | Scoped to parent's children, live attendance rate, absence threshold tracker, simulated SMS thread |
| **Teacher Portal** | `/teacher-portal` | Adviser (`Ms. Rovilyn Osalla`) | Section-scoped rosters (Grade 9 - St. Augustine), absence flag tracking, event participation logs |
| **Security / Admin Portal** | `/security-portal` | Principal Desk / Security | School-wide KPI metrics, channel delivery chart, absence logging, 360° student ID timeline modal |
| **Live Gate Scanner** | `/security-portal/scanner` | Campus Guard | Real-time camera or instant token scanner, screenshot rejection, geofence status verification |

---

## 🔑 Demo Accounts (Quick Fill)

Click **Quick fill demo accounts** on the `/login` screen or use the floating bottom **Demo persona bar**:

| Role | Name | Identifier (Username) | Password | Scoped Context |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Juan Dela Cruz | `USA-JHS-2026-0104` *(or `juan@student.test`)* | `student123` | Grade 9 - St. Augustine |
| **Parent** | Mrs. Maria Dela Cruz | `maria@parent.test` | `parent123` | Linked to Juan Dela Cruz |
| **Teacher** | Ms. Rovilyn Osalla | `osalla@teacher.test` | `teacher123` | Adviser, Grade 9 - St. Augustine |
| **Security** | Security Desk | `security@admin.test` | `admin123` | Gate Scanner & Verification |
| **Admin** | Principal Desk | `principal@admin.test` | `admin123` | Full institution oversight |

---

## 🛡️ Anti-Fraud & Dynamic QR Mechanisms

1. **Anti-Screenshot Replay Protection:**
   - The student QR code is not a static barcode. It embeds a signed payload (`studentId + token + expiresAt`) that automatically re-generates every 30 seconds.
   - Clicking **Simulate expired screenshot** freezes a stale token. Scanning it immediately triggers an **"Expired Token / Screenshot Rejected"** security flag.
2. **Campus Geofencing Validation:**
   - Check-ins verify device location against the University of San Agustin campus boundaries.
   - Toggling **Simulate off-campus** tests rejection of fraudulent off-site check-in attempts.
3. **Absence Early-Warning Threshold:**
   - School policy sets a maximum of 3 unexcused absences (`ABSENCE_THRESHOLD = 3`).
   - Logging a 3rd absence flags the student in red across the Teacher, Parent, and Admin views and simulates an urgent parental SMS notice.

---

## 🚀 Defense Presentation Walkthrough (5-Minute Script)

1. **Step 1: Student Digital ID & QR Rotation (`/student`)**
   - Log in as Juan Dela Cruz (`USA-JHS-2026-0104`).
   - Show the dynamic QR code with its animated countdown ring rotating every 30 seconds.
   - Register for an upcoming event ("Science & Tech Fair 2026") with one tap.
   - Click **Simulate expired screenshot** to demonstrate student fraud prevention.

2. **Step 2: Gate Scanner Verification (`/security-portal/scanner`)**
   - Switch to Security or open the Scanner.
   - Scan the stale token &rarr; Scanner displays a red **"Screenshot Rejected"** rejection banner.
   - Switch student back to **Restore live QR** and scan again &rarr; Verified check-in recorded.

3. **Step 3: Instant Parent Notification (`/parent-portal`)**
   - Switch to Maria Dela Cruz (`maria@parent.test`).
   - View Juan's live attendance rate update.
   - Open the **SMS Inbox** to inspect the simulated real-time text alert received on the parent's phone.

4. **Step 4: Adviser & Principal 360° Oversight (`/security-portal`)**
   - View the Principal Desk. Point out the live participation percentage and channel delivery metrics.
   - Click **+ Log absence** on Juan to hit the absence threshold.
   - Notice the status badge flip to **"Threshold reached"** in red.
   - Click on Juan's ID to open the **Student 360° Modal**, revealing the unified single-ID timeline of all registrations, gate scans, absences, and parent notices.

---

## 💻 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Styling:** [Tailwind CSS 3.4](https://tailwindcss.com/) with Augustine institutional palette (`maroon`, `gold`, `paper`, `ink`)
- **Animations:** [Framer Motion 12](https://motion.dev/) (Spring modals, layout transitions, dynamic ring timers)
- **State & Storage:** [Zustand 5](https://github.com/pmndrs/zustand) with client-side localStorage persistence (works completely offline)
- **Backend / DB:** [Supabase](https://supabase.com/) client with built-in mock fallback for offline resilience
- **Icons:** [Lucide React](https://lucide.react.dev/)
- **Testing:** [Playwright](https://playwright.dev/) end-to-end multi-role test suite

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- npm (or pnpm / yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/kenchi-20/protocap.git
cd protocap

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Configuration (Optional)

The prototype functions 100% offline using client state and local storage. To connect to a live Supabase instance:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

To seed live database tables with demo data:

```bash
npm run seed:users
```

### Running Automated Tests

Run the full end-to-end integration and auth test suite via Playwright:

```bash
npm run test:e2e
```

### Production Build

```bash
npm run build
npm run start
```

---

## ⚠️ Prototype Notes

- **Simulated Channels:** SMS, push notifications, and GPS geofence checks are simulated within the browser for demonstration purposes without requiring live carrier fees or hardware sensors.
- **State Reset:** Click **Reset demo** in the bottom floating toolbar at any time to restore the default seeded roster, reset absence counters, and clear check-in logs.

---

*University of San Agustin — Junior High School · Title Defense Prototype 2026*
