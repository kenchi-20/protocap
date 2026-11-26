"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { AppHeader } from "@/components/AppHeader";
import { Loader2, Check } from "lucide-react";

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

  const demoAccounts = [
    { label: "Student (Juan)", identifier: "USA-JHS-2026-0104", password: "student123", role: "student" },
    { label: "Parent (Mrs. Dela Cruz)", identifier: "maria@parent.test", password: "parent123", role: "parent" },
    { label: "Teacher (Ms. Osalla)", identifier: "osalla@teacher.test", password: "teacher123", role: "teacher" },
    { label: "Admin (Principal)", identifier: "principal@admin.test", password: "admin123", role: "admin" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", bounce: 0, duration: 0.35 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", bounce: 0, duration: 0.3 },
    },
  };

  return (
    <>
      <AppHeader title="Sign in" subtitle="Enter your credentials to access your portal" />
      <main className="mx-auto max-w-md px-4 py-12">
        <motion.form
          onSubmit={handleSubmit}
          noValidate
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
        >
          <motion.div variants={fieldVariants}>
            <label className="block text-sm font-medium text-ink mb-1">Email or Student ID</label>
            <input
              type="text"
              name="identifier"
              id="identifier"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors duration-200 ease-out focus:border-maroon focus:ring-1 focus:ring-maroon/20 placeholder:text-slate-400"
              placeholder="you@example.test or USA-JHS-2026-0104"
              required
              autoComplete="email"
              disabled={loading}
            />
          </motion.div>

          <motion.div variants={fieldVariants}>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors duration-200 ease-out focus:border-maroon focus:ring-1 focus:ring-maroon/20 placeholder:text-slate-400"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 200, ease: [0.23, 1, 0.32, 1] }}
                className="text-sm text-red-600 flex items-center gap-1"
              >
                <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35, delay: 0.2 }}
            className={`
              w-full rounded-full bg-maroon py-3 text-sm font-semibold text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon focus-visible:ring-offset-2
              transition-colors duration-200 ease-out
              ${loading ? "bg-maroon/70 cursor-wait" : "hover:bg-maroon/90"}
            `}
          >
            {loading ? (
              <>
                <svg
                  className="mr-2 inline-block h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.4 }}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick fill demo accounts
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <motion.div variants={cardVariants} custom={0}>
              <Link
                href="/signup"
                className="rounded-xl border border-maroon/20 bg-maroon-soft/30 p-2 text-left hover:border-maroon hover:bg-maroon-soft/50 transition-all duration-200 ease-out active:scale-95 text-xs block"
              >
                <span className="block font-semibold text-ink">Need a parent account?</span>
                <span className="block font-mono text-[10px] text-slate-500 truncate">Sign up</span>
              </Link>
            </motion.div>
            {demoAccounts.map((account, index) => (
              <motion.button
                key={account.identifier}
                variants={cardVariants}
                custom={index}
                type="button"
                onClick={() => {
                  setEmail(account.identifier);
                  setPassword(account.password);
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-slate-200 p-2 text-left hover:border-maroon hover:bg-maroon-soft/30 transition-colors duration-200 ease-out"
              >
                <span className="block font-semibold text-ink">{account.label}</span>
                <span className="block font-mono text-[10px] text-slate-500 truncate">{account.identifier}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 300 }}
          className="mt-4 text-center text-xs text-slate-500"
        >
          juan@student.test (or USA-JHS-2026-0104) / student123
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.5 }}
        >
          <Link
            href="/signup"
            className="block transition-transform active:scale-95"
          >
            <div className="rounded-2xl border border-maroon/20 bg-maroon-soft/30 p-4 text-center transition-colors duration-200 ease-out hover:border-maroon/40 hover:bg-maroon-soft/50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Need a parent account?</p>
              <p className="mt-1 text-sm font-semibold text-maroon">Sign up</p>
            </div>
          </Link>
        </motion.div>
      </main>
    </>
  );
}