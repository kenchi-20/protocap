"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ChannelChart } from "@/components/ChannelChart";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { ABSENCE_THRESHOLD } from "@/types";

export default function AdminPage() {
  const students = usePrototypeStore((s) => s.students);
  const logs = usePrototypeStore((s) => s.logs);
  const notifications = usePrototypeStore((s) => s.notifications);
  const logAbsence = usePrototypeStore((s) => s.logAbsence);
  const openLookup = usePrototypeStore((s) => s.openLookup);
  const [query, setQuery] = useState("");

  const kpis = useMemo(() => {
    const registered = logs.filter((l) => l.registeredAt);
    const checked = registered.filter((l) => l.checkedInAt);
    const participation = registered.length ? Math.round((checked.length / registered.length) * 1000) / 10 : 0;
    const flags = students.filter((s) => s.absenceCount >= ABSENCE_THRESHOLD).length;
    return { participation, flags };
  }, [logs, students]);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.id.toLowerCase().includes(query.toLowerCase()) ||
      s.gradeSection.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <AppHeader
        eyebrow="Principal dashboard"
        title="USA-JHS at a glance"
        subtitle="One roster, one notification ledger, one attendance log — looked up by student ID."
      />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Active JHS students" value={String(students.length)} hint="Seeded roster" />
          <Kpi label="Event participation" value={`${kpis.participation}%`} hint="Checked in ÷ registered" />
          <Kpi label="Delivery success" value="99.2%" hint="In-app, push, and SMS" />
          <Kpi label="Early-warning flags" value={String(kpis.flags)} hint={`Absence threshold ${ABSENCE_THRESHOLD}`} warn={kpis.flags > 0} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Absence threshold</h2>
                <p className="text-xs text-slate-500">The third unexcused absence texts the parent and the adviser.</p>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a student ID"
                className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-maroon sm:w-56"
              />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 font-medium">Student</th>
                    <th className="py-2 font-medium">Section</th>
                    <th className="py-2 font-medium">Absences</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => {
                    const hit = student.absenceCount >= ABSENCE_THRESHOLD;
                    return (
                      <tr key={student.id} className="border-t border-slate-100">
                        <td className="py-2">
                          <button type="button" onClick={() => openLookup(student.id)} className="text-left">
                            <span className="block font-semibold text-ink hover:text-maroon">{student.name}</span>
                            <span className="font-mono text-[11px] text-slate-500">{student.id}</span>
                          </button>
                        </td>
                        <td className="py-2 text-slate-600">{student.gradeSection}</td>
                        <td className="py-2 tabular font-semibold">
                          {student.absenceCount}
                          <span className="font-normal text-slate-400"> / {ABSENCE_THRESHOLD}</span>
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              hit ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {hit ? "Threshold reached" : "Watching"}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => logAbsence(student.id)}
                            className="rounded-full bg-maroon-soft px-2.5 py-1 text-[11px] font-semibold text-maroon hover:bg-maroon hover:text-white"
                          >
                            + Log unexcused absence
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{notifications.length} notices on the unified ledger.</p>
          </div>
          <ChannelChart />
        </section>
      </main>
    </>
  );
}

function Kpi({ label, value, hint, warn }: { label: string; value: string; hint: string; warn?: boolean }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${warn ? "text-red-800" : "text-ink"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
