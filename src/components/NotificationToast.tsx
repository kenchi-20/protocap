"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useEffect } from "react";
import { usePrototypeStore } from "@/store/usePrototypeStore";

export function NotificationToast() {
  const toast = usePrototypeStore((s) => s.toast);
  const dismiss = usePrototypeStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(100%-2rem,22rem)]">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0 }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-maroon/15 bg-white shadow-float"
          >
            <div className="flex items-start gap-3 p-3">
              <span className="relative mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-maroon text-white">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-gold" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-deep">
                  {toast.channel} · {toast.recipientRole}
                </p>
                <p className="truncate text-sm font-semibold text-ink">{toast.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{toast.message}</p>
              </div>
              <button type="button" onClick={dismiss} aria-label="Dismiss alert" className="text-slate-400 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <motion.div
              className="h-0.5 bg-gold"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4.2, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
