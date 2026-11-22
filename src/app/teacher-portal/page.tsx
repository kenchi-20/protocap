"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { fetchSectionsForTeacher, fetchStudentsBySections } from "@/lib/user-db";
import { SearchBar } from "@/components/SearchBar";
import { FilterDropdown } from "@/components/FilterDropdown";
import { AppHeader } from "@/components/AppHeader";
import { ABSENCE_THRESHOLD } from "@/types";
import { LogOut } from "lucide-react";
import type { Student } from "@/types";

export default function TeacherPortalPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logs = usePrototypeStore((s) => s.logs);
  const activities = usePrototypeStore((s) => s.activities);
  const router = useRouter();

  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [mySections, setMySections] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      if (!user) return;
      const sections = await fetchSectionsForTeacher(user.id);
      setMySections(sections);
      const students = await fetchStudentsBySections(sections);
      setMyStudents(students);
    }
    load();
  }, [user]);

  const filteredStudents = useMemo(() => {
    return myStudents.filter((s) => {
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
  }, [myStudents, query, filter]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Flagged only", value: "flagged" },
    ...mySections.map((s) => ({ label: s, value: `grade-${s.split(" ")[1]}` })),
  ];

  return (
    <>
      <AppHeader
        eyebrow="Teacher Portal"
        title={user?.name || "Teacher"}
        subtitle={`Adviser for ${mySections.join(", ")}`}
      />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <SearchBar value={query} onChange={setQuery} placeholder="Search by name, ID, or section" />
            <FilterDropdown
              options={filterOptions}
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

        <div className="rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Absences</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const flagged = student.absenceCount >= ABSENCE_THRESHOLD;
                return (
                  <tr key={student.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-ink">{student.name}</span>
                      <span className="font-mono text-xs text-slate-500">{student.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{student.gradeSection}</td>
                    <td className="px-4 py-3 font-semibold">
                      {student.absenceCount}
                      <span className="font-normal text-slate-400"> / {ABSENCE_THRESHOLD}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          flagged ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {flagged ? "Flagged" : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Recent Activity Registrations</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {logs
              .filter((l) => myStudents.some((s) => s.id === l.studentId) && l.registeredAt)
              .slice(0, 5)
              .map((log) => {
                const student = myStudents.find((s) => s.id === log.studentId);
                const activity = activities.find((a) => a.id === log.activityId);
                return (
                  <li key={log.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-semibold text-ink">{student?.name}</span> registered for <span className="font-semibold">{activity?.title}</span>
                  </li>
                );
              })}
          </ul>
        </section>
      </main>
    </>
  );
}