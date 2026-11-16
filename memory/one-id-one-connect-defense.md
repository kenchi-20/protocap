---
name: one-id-one-connect-defense
description: University of San Agustin Junior High School title defense prototype overview and run instructions
metadata:
  type: project
---

The **ONE ID, ONE CONNECT** title-defense prototype is built in `C:\Users\Administrator\Desktop\PROTOCAP` using Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts, and `qrcode.react`.

## Key Features & Defense Flow
1. **Unified Student ID:** `USA-JHS-2026-0104` for Juan Dela Cruz links announcements, one-tap registration, rotating QR attendance, and parent alerts.
2. **Rotating QR & Anti-Proxy:** A 30-second countdown ring refreshes the token. Clicking **Simulate expired screenshot** creates a stale token that the scanner correctly rejects.
3. **Fraud-Resistant Gate Scanner:** Includes a live webcam scanner and a **Quick scan current student QR** simulator. Toggle **Campus geofence** to simulate an off-campus attempt.
4. **Parent & Adviser Real-Time Portal:** Displays notifications alongside a **Simulated SMS Gateway Phone Frame** (`+63 917 555 0192`).
5. **Principal Dashboard & Student 360:** Tracks JHS attendance rates, channel comparison charts, and an absence threshold simulator (+ Log unexcused absence on Juan or any student to cross 3 and trigger alerts).
6. **Demo Control Bar:** Floating pill bar at the bottom for instant persona switching and resetting demo data.

## Running the App
```bash
cd C:\Users\Administrator\Desktop\PROTOCAP
npm run dev
```
Open `http://localhost:3000`.
