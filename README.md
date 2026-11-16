# ONE ID, ONE CONNECT

Title-defense prototype for the University of San Agustin — Junior High School.

One student ID (`USA-JHS-2026-0104` for Juan Dela Cruz) ties together announcements, one-tap registration, a 30-second rotating QR for attendance, and parent / adviser alerts.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

State is saved in the browser (`localStorage`) so actions survive a refresh. **Reset demo** on the bottom bar restores the seeded roster.

## Defense path

1. **Student** — show the live QR ring, then *Simulate expired screenshot*.
2. **Scanner** — *Quick scan current student QR* accepts a fresh token and rejects the stale one. Toggle *Simulate off-campus* for the location mismatch.
3. **Parent** — the SMS phone frame shows the check-in text to `+63 917 555 0192`.
4. **Admin** — *+ Log unexcused absence* on Juan (he starts at 2) crosses the threshold of 3 and fires the early-warning alert. Click any ID for the single-record timeline.

This is a classroom prototype. SMS, push, and geofence are simulated. There is no live carrier and no campus network check.
 