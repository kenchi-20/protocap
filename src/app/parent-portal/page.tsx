"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { fetchChildrenForParent, fetchStudentsByIds } from "@/lib/user-db";
import { SearchBar } from "@/components/SearchBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { AppHeader } from "@/components/AppHeader";
import { formatClock } from "@/lib/format";
import { ABSENCE_THRESHOLD } from "@/types";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import type { Student } from "@/types";

export default function ParentPortalPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notifications = usePrototypeStore((s) => s.notifications);
  const logs = usePrototypeStore((s) => s.logs);
  const activities = usePrototypeStore((s) => s.activities);
  const router = useRouter();

  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      if (!user) return;
      const childIds = await fetchChildrenForParent(user.id);
      const students = await fetchStudentsByIds(childIds);
      setMyStudents(students);
    }
    load();
  }, [user]);

  const filteredStudents = useMemo(() => {
    return myStudents.filter((s) => {
      const matchesQuery =
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" ? true :
        filter === "flagged" ? s.absenceCount >= ABSENCE_THRESHOLD :
        true;
      return matchesQuery && matchesFilter;
    });
  }, [myStudents, query, filter]);

  const toggleExpand = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <AppHeader
        eyebrow="Parent Portal"
        title={user?.name || "Parent"}
        subtitle="View your child's attendance and activity participation"
      />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <SearchBar value={query} onChange={setQuery} placeholder="Search by name or ID" />
            <FilterDropdown
              options={[
                { label: "All", value: "all" },
                { label: "Flagged", value: "flagged" },
              ]}
              selected={filter}
              onChange={setFilter}
            />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        {filteredStudents.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500">
            No children found for your account.
          </p>
        )}

        <div className="space-y-3">
          {filteredStudents.map((student) => {
            const isExpanded = expandedStudents.has(student.id);
            const studentLogs = logs.filter((l) => l.studentId === student.id);
            const regs = studentLogs.filter((l) => l.registeredAt);
            const checks = studentLogs.filter((l) => l.checkedInAt);
            const attendanceRate = regs.length === 0 ? 0 : Math.round((checks.length / regs.length) * 100);
            const flagged = student.absenceCount >= ABSENCE_THRESHOLD;

            return (
              <div key={student.id} className="rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(student.id)}
                  className="w-full p-4 text-left flex items-center justify-between"
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
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-3">
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">Absences</dt>
                        <dd className="font-semibold">{student.absenceCount} / {ABSENCE_THRESHOLD}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Attendance rate</dt>
                        <dd className="font-semibold">{attendanceRate}%</dd>
                      </div>
                    </dl>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Recent Activity</h4>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {regs.slice(0, 3).map((log) => {
                          const activity = activities.find((a) => a.id === log.activityId);
                          return (
                            <li key={log.id}>
                              {activity?.title} — {log.checkedInAt ? "Checked in" : "Registered"}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">SMS Inbox</h4>
                      <ul className="space-y-2 text-xs">
                        {notifications
                          .filter((n) => n.studentId === student.id && n.channel === "SMS" && n.recipientRole === "Parent")
                          .slice(0, 3)
                          .map((n) => (
                            <li key={n.id} className="rounded-lg bg-slate-50 p-2">
                              <p className="font-semibold text-ink">{n.title}</p>
                              <p className="text-slate-600">{n.message}</p>
                              <p className="text-slate-400">{formatClock(n.timestamp)}</p>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}