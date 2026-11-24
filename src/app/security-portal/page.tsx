"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { SearchBar } from "@/components/SearchBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { ChannelChart } from "@/components/ChannelChart";
import { AppHeader } from "@/components/AppHeader";
import { ABSENCE_THRESHOLD } from "@/types";
import { LogOut, QrCode } from "lucide-react";

export default function SecurityPortalPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logs = usePrototypeStore((s) => s.logs);
  const students = usePrototypeStore((s) => s.students);
  const logAbsence = usePrototypeStore((s) => s.logAbsence);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesQuery =
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase()) ||
        s.gradeSection.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" ? true :
        filter === "flagged" ? s.absenceCount >= ABSENCE_THRESHOLD :
        filter.startsWith("grade-") ? s.gradeSection.includes(filter.replace("grade-", "Grade ")) :
        true;
      return matchesQuery && matchesFilter;
    });
  }, [students, query, filter]);

  const kpis = useMemo(() => {
    const registered = logs.filter((l) => l.registeredAt);
    const checked = registered.filter((l) => l.checkedInAt);
    const participation = registered.length ? Math.round((checked.length / registered.length) * 100) : 0;
    const flags = students.filter((s) => s.absenceCount >= ABSENCE_THRESHOLD).length;
    return { participation, flags };
  }, [logs, students]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const canLogAbsence = user?.role === "admin";

  const gradeOptions = [...new Set(students.map((s) => s.gradeSection))].map((s) => ({
    label: s,
    value: `grade-${s.split(" ")[1]}`,
  }));

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Flagged only", value: "flagged" },
    ...gradeOptions,
  ];

  return (
    <>
      <AppHeader
        eyebrow={user?.role === "admin" ? "Admin Portal" : "Security Portal"}
        title={user?.name || "Dashboard"}
        subtitle="System-wide student data and gate operations"
      />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <SearchBar value={query} onChange={setQuery} placeholder="Search by name, ID, or section" />
            <FilterDropdown
              options={filterOptions}
              selected={filter}
              onChange={setFilter}
            />
          </div>
          <div className="flex gap-2">
            <Link
              href="/security-portal/scanner"
              className="flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gold-deep"
            >
              <QrCode className="h-3.5 w-3.5" />
              Gate Scanner
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Active JHS students" value={String(students.length)} hint="Full roster" />
          <Kpi label="Event participation" value={`${kpis.participation}%`} hint="Checked in ÷ registered" />
          <Kpi label="Delivery success" value="99.2%" hint="In-app, push, and SMS" />
          <Kpi label="Early-warning flags" value={String(kpis.flags)} hint={`Absence threshold ${ABSENCE_THRESHOLD}`} warn={kpis.flags > 0} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
            <h2 className="text-sm font-semibold text-ink">Student List</h2>
            <p className="text-xs text-slate-500 mt-1">All JHS students — {filteredStudents.length} shown</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 font-medium">Student</th>
                    <th className="py-2 font-medium">Section</th>
                    <th className="py-2 font-medium">Absences</th>
                    <th className="py-2 font-medium">Status</th>
                    {canLogAbsence && <th className="py-2 font-medium" />}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const flagged = student.absenceCount >= ABSENCE_THRESHOLD;
                    return (
                      <tr key={student.id} className="border-t border-slate-100">
                        <td className="py-2">
                          <span className="block font-semibold text-ink">{student.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">{student.id}</span>
                        </td>
                        <td className="py-2 text-slate-600">{student.gradeSection}</td>
                        <td className="py-2 tabular font-semibold">
                          {student.absenceCount}
                          <span className="font-normal text-slate-400"> / {ABSENCE_THRESHOLD}</span>
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              flagged ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {flagged ? "Threshold reached" : "Watching"}
                          </span>
                        </td>
                        {canLogAbsence && (
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => logAbsence(student.id)}
                              className="rounded-full bg-maroon-soft px-2.5 py-1 text-[11px] font-semibold text-maroon hover:bg-maroon hover:text-white"
                            >
                              + Log absence
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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