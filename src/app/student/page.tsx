"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MapPin } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DynamicStudentQR } from "@/components/DynamicStudentQR";
import { formatClock } from "@/lib/format";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { ABSENCE_THRESHOLD, DEMO_STUDENT_ID } from "@/types";

const tabs = ["Announcements", "My registrations", "History"] as const;

export default function StudentPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Announcements");
  const student = usePrototypeStore((s) => s.students.find((st) => st.id === DEMO_STUDENT_ID)!);
  const activities = usePrototypeStore((s) => s.activities);
  const logs = usePrototypeStore((s) => s.logs);
  const notifications = usePrototypeStore((s) => s.notifications);
  const register = usePrototypeStore((s) => s.register);

  const mine = logs.filter((l) => l.studentId === student.id);
  const registered = (id: string) => mine.some((l) => l.activityId === id && l.registeredAt);

  return (
    <>
      <AppHeader
        eyebrow="Student portal"
        title={student.name}
        subtitle={`${student.gradeSection} · consent on file · adviser ${student.adviserName}`}
      />
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-3xl bg-maroon p-5 text-white shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 font-display text-xl">
              {student.avatarInitials}
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Digital ID</p>
              <p className="font-mono text-sm">{student.id}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-3 text-ink">
            <DynamicStudentQR studentId={student.id} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-white/60">Absences</dt>
              <dd className="font-semibold tabular">
                {student.absenceCount} <span className="font-normal text-white/70">/ {ABSENCE_THRESHOLD}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-white/60">Parent</dt>
              <dd className="truncate font-semibold">{student.parentName.replace("Mrs. ", "")}</dd>
            </div>
          </dl>
        </section>

        <section>
          <div className="flex gap-1 rounded-full bg-white p-1 shadow-card">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold sm:text-sm ${
                  tab === item ? "bg-maroon text-white" : "text-slate-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-3"
            >
              {tab === "Announcements" &&
                activities.map((activity) => {
                  const done = registered(activity.id);
                  return (
                    <article key={activity.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-maroon-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-maroon">
                          {activity.category}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                          {activity.status}
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-xl text-ink">{activity.title}</h2>
                      <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {activity.date} · {activity.time} · {activity.venue}
                      </p>
                      <div className="mt-3">
                        {!activity.requiresRegistration ? (
                          <span className="text-xs font-semibold text-slate-500">Campus notice · no registration</span>
                        ) : activity.status === "Completed" ? (
                          <span className="text-xs font-semibold text-slate-500">Closed · see history</span>
                        ) : (
                          <button
                            type="button"
                            disabled={done}
                            onClick={() => register(student.id, activity.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              done ? "bg-emerald-50 text-emerald-800" : "bg-gold text-ink hover:bg-gold-deep hover:text-white"
                            }`}
                          >
                            {done && <Check className="h-3.5 w-3.5" />}
                            {done ? "Registered ✓" : "One-tap register"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}

              {tab === "My registrations" && (
                <>
                  {mine.filter((l) => l.registeredAt && activities.find((a) => a.id === l.activityId)?.status !== "Completed").length === 0 && (
                    <p className="rounded-3xl bg-white p-4 text-sm text-slate-500">Nothing upcoming yet. Register from Announcements.</p>
                  )}
                  {mine
                    .filter((l) => l.registeredAt)
                    .map((log) => {
                      const activity = activities.find((a) => a.id === log.activityId);
                      if (!activity || activity.status === "Completed") return null;
                      return (
                        <article key={log.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
                          <h2 className="font-display text-xl">{activity.title}</h2>
                          <p className="mt-1 text-sm text-slate-600">
                            {activity.date} · {activity.venue}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {log.checkedInAt
                              ? `Checked in ${formatClock(log.checkedInAt)} · ${log.verificationMethod}`
                              : "Registered. Show the live QR at the gate — not a screenshot."}
                          </p>
                        </article>
                      );
                    })}
                </>
              )}

              {tab === "History" && (
                <ol className="space-y-2">
                  {notifications
                    .filter((n) => n.studentId === student.id)
                    .map((n) => (
                      <li key={n.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-maroon">
                          {n.type} · {n.channel}
                        </p>
                        <p className="text-sm font-semibold text-ink">{n.title}</p>
                        <p className="text-xs text-slate-500">{formatClock(n.timestamp)}</p>
                      </li>
                    ))}
                </ol>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </>
  );
}
