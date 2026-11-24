"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { CameraOff, RefreshCw } from "lucide-react";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { QR_TTL_MS } from "@/types";

const SIZE = 168;
const STROKE = 7;
const R = (SIZE + 28) / 2 - STROKE;
const CIRC = 2 * Math.PI * R;

export function DynamicStudentQR({ studentId }: { studentId: string }) {
  const liveToken = usePrototypeStore((s) => s.liveToken);
  const staleToken = usePrototypeStore((s) => s.staleToken);
  const useStale = usePrototypeStore((s) => s.useStaleToken);
  const issue = usePrototypeStore((s) => s.issueLiveToken);
  const simulate = usePrototypeStore((s) => s.simulateExpiredQr);
  const clearStale = usePrototypeStore((s) => s.clearStale);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    issue(studentId);
  }, [studentId, issue]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      const current = usePrototypeStore.getState().liveToken;
      if (!current || current.studentId !== studentId || t >= current.expiresAt) {
        usePrototypeStore.getState().issueLiveToken(studentId);
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [studentId]);

  const shown = useStale && staleToken ? staleToken : liveToken;
  const remaining = shown ? Math.max(0, shown.expiresAt - now) : 0;
  const progress = useStale ? 0 : Math.min(1, remaining / QR_TTL_MS);
  const seconds = Math.ceil(remaining / 1000);
  const payload = shown ? JSON.stringify(shown) : "";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative grid place-items-center">
        <svg width={SIZE + 28} height={SIZE + 28} className="-rotate-90">
          <circle cx={(SIZE + 28) / 2} cy={(SIZE + 28) / 2} r={R} fill="none" stroke="#E7D3D3" strokeWidth={STROKE} />
          <motion.circle
            cx={(SIZE + 28) / 2}
            cy={(SIZE + 28) / 2}
            r={R}
            fill="none"
            stroke={useStale ? "#A32D2D" : "#D97706"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            animate={{ strokeDashoffset: CIRC * (1 - progress) }}
            transition={{ duration: 0.2 }}
          />
        </svg>
        <div className="absolute rounded-2xl bg-white p-2 shadow-card">
          {payload ? (
            <QRCodeSVG value={payload} size={SIZE - 16} bgColor="#ffffff" fgColor={useStale ? "#94A3B8" : "#5C1212"} level="M" />
          ) : (
            <div style={{ width: SIZE - 16, height: SIZE - 16 }} />
          )}
          {useStale && (
            <div className="absolute inset-2 grid place-items-center rounded-xl bg-white/75">
              <span className="rounded-full bg-red-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Expired
              </span>
            </div>
          )}
        </div>
        <span className="absolute -bottom-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold tabular text-white">
          {useStale ? "stale token" : `${seconds}s`}
        </span>
      </div>
      <p className="max-w-[16rem] text-center text-[11px] leading-relaxed text-slate-500">
        Payload is <span className="font-medium text-ink">studentId + token + expiresAt</span>. It rotates every 30 seconds.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => simulate(studentId)}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
        >
          <CameraOff className="h-3.5 w-3.5" />
          Simulate expired screenshot
        </button>
        {useStale && (
          <button
            type="button"
            onClick={() => {
              clearStale();
              issue(studentId);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-3 py-1.5 text-xs font-semibold text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restore live QR
          </button>
        )}
      </div>
    </div>
  );
}
