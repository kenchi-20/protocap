"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { AppHeader } from "@/components/AppHeader";
import { formatClock } from "@/lib/format";
import { useAuthStore } from "@/store/useAuthStore";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import type { ScanResult } from "@/types";

export default function ScannerPage() {
  const user = useAuthStore((s) => s.user);
  const geofence = usePrototypeStore((s) => s.campusGeofence);
  const setGeofence = usePrototypeStore((s) => s.setCampusGeofence);
  const verifyScan = usePrototypeStore((s) => s.verifyScan);
  const manualCheckIn = usePrototypeStore((s) => s.manualCheckIn);
  const lastScan = usePrototypeStore((s) => s.lastScan);
  const scanLog = usePrototypeStore((s) => s.scanLog);
  const focusId = usePrototypeStore((s) => s.focusStudentId);
  const liveToken = usePrototypeStore((s) => s.liveToken);
  const staleToken = usePrototypeStore((s) => s.staleToken);
  const useStale = usePrototypeStore((s) => s.useStaleToken);
  const [manual, setManual] = useState(focusId);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-region";

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) scanner.stop().catch(() => undefined);
    };
  }, []);

  async function toggleCamera() {
    setCameraError(null);
    if (cameraOn && scannerRef.current) {
      await scannerRef.current.stop();
      setCameraOn(false);
      return;
    }
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          verifyScan(decoded);
        },
        () => undefined
      );
      setCameraOn(true);
    } catch {
      setCameraError("Camera unavailable. Use Quick scan or type the student ID.");
      setCameraOn(false);
    }
  }

  function quickScan() {
    const token = useStale ? staleToken : liveToken;
    if (!token) {
      const issued = usePrototypeStore.getState().issueLiveToken(focusId);
      verifyScan(JSON.stringify(issued));
      return;
    }
    verifyScan(JSON.stringify(token));
  }

  return (
    <>
      <AppHeader
        eyebrow={user?.role === "admin" ? "Admin Gate Scanner" : "Security Gate Scanner"}
        title="Science & Tech Fair gate"
        subtitle="A token must be under 30 seconds old and the device must be on the USA Iloilo campus network."
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4">
          <Link
            href="/security-portal"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Security Portal
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
            <div>
              <p className="text-sm font-semibold text-ink">Campus Wi-Fi / geofence</p>
              <p className="text-xs text-slate-500">
                {geofence ? "ACTIVE · USA Iloilo Campus" : "Simulating an off-campus attempt"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGeofence(!geofence)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                geofence ? "bg-emerald-50 text-emerald-800" : "bg-amber-100 text-amber-900"
              }`}
            >
              {geofence ? "Campus verified" : "Simulate off-campus"}
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-ink shadow-card">
            <div id={regionId} className="min-h-56 bg-ink" />
            {!cameraOn && (
              <p className="px-4 py-6 text-center text-sm text-white/70">Camera is off. Projector rooms can skip it.</p>
            )}
          </div>
          {cameraError && <p className="text-sm text-red-800">{cameraError}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={toggleCamera} className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-white">
              {cameraOn ? "Stop camera" : "Start camera"}
            </button>
            <button type="button" onClick={quickScan} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">
              Quick scan current student QR
            </button>
          </div>

          <form
            className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              manualCheckIn(manual);
            }}
          >
            <label className="sr-only" htmlFor="manual-id">
              Student ID
            </label>
            <input
              id="manual-id"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className="flex-1 rounded-full border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-maroon"
              placeholder="USA-JHS-2026-0104"
            />
            <button type="submit" className="rounded-full border border-maroon px-4 py-2 text-sm font-semibold text-maroon">
              Manual ID fallback
            </button>
          </form>

          <ResultCard result={lastScan} />
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Recent scans</h2>
          <ul className="mt-3 space-y-2">
            {scanLog.length === 0 && <li className="text-sm text-slate-500">No scans this session.</li>}
            {scanLog.map((scan) => (
              <li key={scan.id} className="border-t border-slate-100 pt-2 text-sm">
                <p className="font-semibold text-ink">{scan.studentName ?? "Rejected"}</p>
                <p className="text-xs text-slate-500">
                  {scan.kind} · {scan.method} · {formatClock(scan.at)}
                </p>
              </li>
            ))}
          </ul>
        </aside>
        </div>
      </main>
    </>
  );
}

function ResultCard({ result }: { result: ScanResult | null }) {
  if (!result) return null;
  const tone =
    result.kind === "valid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : result.kind === "off-campus"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-red-200 bg-red-50 text-red-950";
  const heading =
    result.kind === "valid"
      ? "Checked in"
      : result.kind === "expired"
        ? "Proxy alert"
        : result.kind === "off-campus"
          ? "Location mismatch"
          : result.kind === "duplicate"
            ? "Already inside"
            : "Not recognized";
  return (
    <div className={`rounded-3xl border p-4 ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{heading}</p>
      <p className="mt-1 text-lg font-semibold">{result.studentName ?? "Unknown code"}</p>
      <p className="text-sm">{result.message}</p>
      {result.studentId && <p className="mt-1 font-mono text-xs opacity-70">{result.studentId}</p>}
    </div>
  );
}
