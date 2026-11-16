"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { formatClock, formatTime } from "@/lib/format";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { ABSENCE_THRESHOLD, DEMO_STUDENT_ID } from "@/types";

export default function ParentPage() {
  const [lane, setLane] = useState<"Parent" | "Adviser">("Parent");
  const student = usePrototypeStore((s) => s.students.find((s) => s.id === DEMO_STUDENT_ID)!);
  const notifications = usePrototypeStore((s) => s.notifications);
  const logs = usePrototypeStore((s) => s.logs);
  const activities = usePrototypeStore((s) => s.activities);
  const markRead = usePrototypeStore((s) => s.markRead);

  const inbox = notifications.filter((n) => n.studentId === student.id && n.recipientRole === lane);
  const sms = notifications
    .filter((n) => n.studentId === student.id && n.channel === "SMS" && n.recipientRole === "Parent")
    .slice()
    .reverse();
  const regs = logs.filter((l) => l.studentId === student.id && l.registeredAt);
  const checks = logs.filter((l) => l.studentId === student.id && l.checkedInAt);
  const attendanceRate = regs.length === 0 ? 0 : Math.round((checks.length / Math.max(regs.length, 1)) * 100);
  const flagged = student.absenceCount >= ABSENCE_THRESHOLD;

  return (
    <>
      <AppHeader
        eyebrow="Parent & adviser"
        title={lane === "Parent" ? student.parentName : student.adviserName}
        subtitle={
          lane === "Parent"
            ? `Parent of ${student.name} · ${student.parentContact}`
            : `Class adviser · ${student.gradeSection}`
        }
      />
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-3 flex gap-1 rounded-full bg-white p-1 shadow-card w-fit">
            {(["Parent", "Adviser"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLane(item)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  lane === item ? "bg-maroon text-white" : "text-slate-600"
                }`}
              >
                {item === "Parent" ? "Maria Dela Cruz" : "Ms. Osalla"}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {inbox.length === 0 && <li className="rounded-2xl bg-white p-4 text-sm text-slate-500">No alerts on this lane yet.</li>}
            {inbox.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => markRead(note.id)}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-left shadow-card ${
                    note.read ? "border-slate-200" : "border-gold/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-maroon">
                      {note.type} · {note.channel}
                    </p>
                    {!note.read && <span className="h-2 w-2 rounded-full bg-gold" />}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink">{note.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{note.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatClock(note.timestamp)}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Juan’s engagement</p>
            <p className="mt-1 font-mono text-xs text-maroon">{student.id}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Attendance on registered events" value={`${attendanceRate}%`} />
              <Row label="Registered" value={String(regs.length)} />
              <Row
                label="Unexcused absences"
                value={`${student.absenceCount} / ${ABSENCE_THRESHOLD}`}
                warn={flagged}
              />
            </dl>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {regs.map((log) => (
                <li key={log.id}>
                  {activities.find((a) => a.id === log.activityId)?.title}
                  {log.checkedInAt ? " · checked in" : " · registered"}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-[270px] rounded-[2rem] border-4 border-ink bg-slate-100 p-3 shadow-float">
            <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-semibold text-slate-500">
              <span>SMS</span>
              <span className="font-mono">{student.parentContact}</span>
            </div>
            <div className="flex h-[340px] flex-col justify-end gap-2 overflow-y-auto rounded-2xl bg-[#E7F8D8] p-2">
              {sms.map((note) => (
                <div key={note.id} className="max-w-[92%] self-start rounded-2xl rounded-bl-sm bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] leading-relaxed text-ink">{note.message}</p>
                  <p className="mt-1 text-right text-[10px] text-slate-400">{formatTime(note.timestamp)}</p>
                </div>
              ))}
              {sms.length === 0 && <p className="p-3 text-center text-xs text-slate-500">No SMS yet.</p>}
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">Simulated gateway · not a live carrier</p>
          </div>
        </aside>
      </main>
    </>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-semibold tabular ${warn ? "text-red-800" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
