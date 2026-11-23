"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, RotateCcw, Shield, UserRound, Users } from "lucide-react";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { Role } from "@/types";

const roles: {
  id: Role;
  label: string;
  who: string;
  href: string;
  icon: typeof UserRound;
  creds?: { id: string; pass: string };
}[] = [
  {
    id: "student",
    label: "Student",
    who: "Juan Dela Cruz",
    href: "/student",
    icon: UserRound,
    creds: { id: "USA-JHS-2026-0104", pass: "student123" },
  },
  {
    id: "parent",
    label: "Parent",
    who: "Maria Dela Cruz",
    href: "/parent-portal",
    icon: Users,
    creds: { id: "maria@parent.test", pass: "parent123" },
  },
  {
    id: "admin",
    label: "Admin",
    who: "Principal desk",
    href: "/security-portal",
    icon: Shield,
    creds: { id: "principal@admin.test", pass: "admin123" },
  },
];

export function DemoSwitcherBar() {
  const [open, setOpen] = useState(true);
  const role = usePrototypeStore((s) => s.role);
  const setRole = usePrototypeStore((s) => s.setRole);
  const resetDemo = usePrototypeStore((s) => s.resetDemo);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const path = usePathname();

  async function go(item: (typeof roles)[number]) {
    setRole(item.id);
    if (item.creds) {
      await login(item.creds.id, item.creds.pass);
    }
    if (!path.startsWith(item.href)) router.push(item.href);
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 pointer-events-none">
      <motion.div layout className="pointer-events-auto w-full max-w-3xl">
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="bar"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-ink/95 p-2 text-white shadow-float backdrop-blur sm:flex-row sm:items-center"
            >
              <div className="hidden px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-soft/80 sm:block">
                Demo
              </div>
              <div className="grid flex-1 grid-cols-3 gap-1">
                {roles.map((item) => {
                  const Icon = item.icon;
                  const active = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item)}
                      className={`flex items-center justify-center gap-2 rounded-2xl px-2 py-2 text-left transition ${
                        active ? "bg-maroon text-white" : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{item.label}</span>
                        <span className="hidden truncate text-[10px] text-white/70 md:block">{item.who}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    resetDemo();
                    router.push("/");
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-gold-soft hover:bg-white/15"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset demo
                </button>
                <button
                  type="button"
                  aria-label="Collapse demo bar"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-white/10 px-2 hover:bg-white/15"
                >
                  <ChevronUp className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="pill"
              type="button"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(true)}
              className="mx-auto flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-float"
            >
              <ChevronUp className="h-3.5 w-3.5 text-gold" />
              Demo personas
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
