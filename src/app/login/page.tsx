"use client";

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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
              placeholder="you@example.test"
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
        <p className="mt-4 text-center text-xs text-slate-500">
          juan@student.test (or USA-JHS-2026-0104) / student123
        </p>
      </main>
    </>
  );
}