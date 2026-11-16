"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { formatClock } from "@/lib/format";
import { ABSENCE_THRESHOLD } from "@/types";

export function Student360Modal() {
  const lookupId = usePrototypeStore((s) => s.lookupId);
  const openLookup = usePrototypeStore((s) => s.openLookup);
  const students = usePrototypeStore((s) => s.students);
  const logs = usePrototypeStore((s) => s.logs);
  const activities = usePrototypeStore((s) => s.activities);
  const notifications = usePrototypeStore((s) => s.notifications);

  const student = students.find((s) => s.id === lookupId);
  if (!lookupId) return null;

  const studentLogs = logs.filter((l) => l.studentId === lookupId);
  const notes = notifications.filter((n) => n.studentId === lookupId);

  const timeline = [
    ...notes.map((n) => ({
      at: n.timestamp,
      kind: "Notice",
      title: `${n.channel} → ${n.recipientRole}`,
      detail: n.title,
    })),
    ...studentLogs
      .filter((l) => l.registeredAt)
      .map((l) => ({
        at: l.registeredAt as string,
        kind: "Registration",
        title: activities.find((a) => a.id === l.activityId)?.title ?? l.activityId,
        detail: "Linked to this student ID",
      })),
    ...studentLogs
      .filter((l) => l.checkedInAt)
      .map((l) => ({
        at: l.checkedInAt as string,
        kind: "Attendance",
        title: activities.find((a) => a.id === l.activityId)?.title ?? l.activityId,
        detail: `${l.verificationMethod ?? "Verified"} · ${l.geofenceStatus ?? ""}`,
      })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => openLookup(null)}
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-paper shadow-float sm:rounded-3xl"
        >
          <div className="flex items-start justify-between gap-3 bg-maroon px-5 py-4 text-white">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Single ID timeline</p>
              <h2 className="font-display text-2xl">{student?.name ?? lookupId}</h2>
              <p className="font-mono text-xs text-white/80">{lookupId}</p>
            </div>
            <button type="button" onClick={() => openLookup(null)} aria-label="Close" className="rounded-full bg-white/10 p-1.5">
              <X className="h-4 w-4" />
            </button>
          </div>
          {student && (
            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-white px-5 py-3 text-center">
              <Stat label="Section" value={student.gradeSection.replace("Grade ", "G")} />
              <Stat label="Absences" value={`${student.absenceCount} / ${ABSENCE_THRESHOLD}`} />
              <Stat label="Parent" value={student.parentName.split(" ").slice(-1)[0]} />
            </div>
          )}
          <ol className="space-y-3 overflow-y-auto px-5 py-4">
            {timeline.map((item, i) => (
              <li key={`${item.kind}-${item.at}-${i}`} className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-maroon">{item.kind}</p>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.detail} · {formatClock(item.at)}
                  </p>
                </div>
              </li>
            ))}
            {timeline.length === 0 && <p className="text-sm text-slate-500">No events on this ID yet.</p>}
          </ol>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
