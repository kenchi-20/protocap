"use client";

import Link from "next/link";
import { ArrowRight, Bell, QrCode, ShieldCheck, UserRound } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DEMO_STUDENT_ID } from "@/types";

const lanes = [
  {
    href: "/login",
    title: "Student portal",
    who: "Juan Dela Cruz",
    id: DEMO_STUDENT_ID,
    copy: "Digital ID, a 30-second rotating QR, one-tap registration, and a history tied to that same ID.",
    icon: UserRound,
  },
  {
    href: "/login",
    title: "Gate scanner",
    who: "Science & Tech Fair",
    id: "Live check-in",
    copy: "Accept a fresh token, reject a screenshot, and block an off-campus attempt. Parents are texted on a valid scan.",
    icon: QrCode,
  },
  {
    href: "/login",
    title: "Parent & adviser",
    who: "Mrs. Maria Dela Cruz",
    id: "+63 917 555 0192",
    copy: "The same events appear as an inbox and as a simulated SMS thread on the parent’s phone.",
    icon: Bell,
  },
  {
    href: "/login",
    title: "Principal desk",
    who: "USA-JHS oversight",
    id: "12 students",
    copy: "Participation, channel delivery, the absence threshold, and a 360° lookup on any student ID.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <>
      <AppHeader
        title="One ID. One connect."
        subtitle="Announcements, registration, attendance, and parent alerts all hang off a single Junior High student ID."
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-3xl bg-maroon text-white shadow-card">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">University of San Agustin · Iloilo</p>
              <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
                Stop splitting the student across four systems.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
                Juan Dela Cruz is <span className="font-semibold text-white">{DEMO_STUDENT_ID}</span> everywhere: the feed he registers from, the QR the gate scans, the SMS his mother receives, and the row on the principal’s early-warning list.
              </p>
              <Link
                href="/student"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink"
              >
                Open Juan’s ID
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ol className="space-y-2 rounded-2xl bg-white/10 p-4 text-sm">
              {[
                "One-tap register for Intramurals",
                "Scan the live QR at the Science Fair",
                "Reject a screenshot older than 30 seconds",
                "Log the 3rd absence and watch the parent SMS",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-ink">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-white/90">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {lanes.map((lane) => {
            const Icon = lane.icon;
            return (
              <Link
                key={lane.title}
                href={lane.href}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-maroon-soft text-maroon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-maroon" />
                </div>
                <h3 className="mt-4 font-display text-2xl text-ink">{lane.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold-deep">
                  {lane.who} · {lane.id}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{lane.copy}</p>
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
