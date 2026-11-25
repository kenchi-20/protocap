"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AppHeader } from "@/components/AppHeader";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Login failed");
      return;
    }

    // Redirect based on role
    const user = useAuthStore.getState().user;
    if (user?.role === "student") router.push("/student");
    else if (user?.role === "parent") router.push("/parent-portal");
    else if (user?.role === "teacher") router.push("/teacher-portal");
    else router.push("/security-portal");
  };

  return (
    <>
      <AppHeader title="Sign in" subtitle="Enter your credentials to access your portal" />
      <main className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div>
            <label className="block text-sm font-medium text-ink">Email or Student ID</label>
            <input
              type="text"
              name="identifier"
              id="identifier"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
              placeholder="you@example.test or USA-JHS-2026-0104"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-maroon py-2.5 text-sm font-semibold text-white hover:bg-maroon/90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick fill demo accounts
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Link href="/signup" className="rounded-xl border border-maroon/20 bg-maroon-soft/30 p-2 text-left hover:border-maroon hover:bg-maroon-soft/30 transition text-xs">
              <span className="block font-semibold text-ink">Need a parent account?</span>
              <span className="block font-mono text-[10px] text-slate-500 truncate">Sign up</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setEmail("USA-JHS-2026-0104");
                setPassword("student123");
              }}
              className="rounded-xl border border-slate-200 p-2 text-left hover:border-maroon hover:bg-maroon-soft/30 transition"
            >
              <span className="block font-semibold text-ink">Student (Juan)</span>
              <span className="block font-mono text-[10px] text-slate-500 truncate">USA-JHS-2026-0104</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("maria@parent.test");
                setPassword("parent123");
              }}
              className="rounded-xl border border-slate-200 p-2 text-left hover:border-maroon hover:bg-maroon-soft/30 transition"
            >
              <span className="block font-semibold text-ink">Parent (Mrs. Dela Cruz)</span>
              <span className="block font-mono text-[10px] text-slate-500 truncate">maria@parent.test</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("osalla@teacher.test");
                setPassword("teacher123");
              }}
              className="rounded-xl border border-slate-200 p-2 text-left hover:border-maroon hover:bg-maroon-soft/30 transition"
            >
              <span className="block font-semibold text-ink">Teacher (Ms. Osalla)</span>
              <span className="block font-mono text-[10px] text-slate-500 truncate">osalla@teacher.test</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("principal@admin.test");
                setPassword("admin123");
              }}
              className="rounded-xl border border-slate-200 p-2 text-left hover:border-maroon hover:bg-maroon-soft/30 transition"
            >
              <span className="block font-semibold text-ink">Admin (Principal)</span>
              <span className="block font-mono text-[10px] text-slate-500 truncate">principal@admin.test</span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          juan@student.test (or USA-JHS-2026-0104) / student123
        </p>

        <Link href="/signup" className="mt-6 block">
          <div className="rounded-2xl border border-maroon/20 bg-maroon-soft/30 p-4 text-center transition hover:border-maroon/40 hover:bg-maroon-soft/50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Need a parent account?</p>
            <p className="mt-1 text-sm font-semibold text-maroon">Sign up</p>
          </div>
        </Link>
      </main>
    </>
  );
}