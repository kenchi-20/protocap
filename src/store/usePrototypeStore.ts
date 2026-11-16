"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cloneSeed } from "@/lib/seed";
import { randomToken, uid } from "@/lib/format";
import type {
  Activity,
  AttendanceLog,
  NotificationLog,
  QrToken,
  Role,
  ScanResult,
  Student,
  VerificationMethod,
} from "@/types";
import { ABSENCE_THRESHOLD, DEMO_STUDENT_ID, LIVE_ACTIVITY_ID, QR_TTL_MS } from "@/types";

interface PrototypeState {
  role: Role;
  students: Student[];
  activities: Activity[];
  logs: AttendanceLog[];
  notifications: NotificationLog[];
  campusGeofence: boolean;
  focusStudentId: string;
  liveToken: QrToken | null;
  staleToken: QrToken | null;
  useStaleToken: boolean;
  lastScan: ScanResult | null;
  scanLog: ScanResult[];
  toast: NotificationLog | null;
  lookupId: string | null;
  hydrated: boolean;

  setRole: (role: Role) => void;
  setHydrated: (v: boolean) => void;
  resetDemo: () => void;
  setCampusGeofence: (on: boolean) => void;
  setFocusStudent: (id: string) => void;
  issueLiveToken: (studentId?: string) => QrToken;
  simulateExpiredQr: (studentId?: string) => QrToken;
  clearStale: () => void;
  register: (studentId: string, activityId: string) => { ok: boolean; reason?: string };
  verifyScan: (raw: string, method?: VerificationMethod) => ScanResult;
  manualCheckIn: (studentId: string) => ScanResult;
  logAbsence: (studentId: string) => void;
  markRead: (id: string) => void;
  dismissToast: () => void;
  openLookup: (id: string | null) => void;
}

function fanOut(
  student: Student,
  activityTitle: string,
  kind: "register" | "checkin" | "absence",
  now: string
): NotificationLog[] {
  if (kind === "register") {
    return [
      {
        id: uid("ntf"),
        studentId: student.id,
        recipientRole: "Student",
        channel: "In-App",
        type: "Registration Confirmed",
        title: `Registered · ${activityTitle}`,
        message: `${student.name} (${student.id}) is on the roll for ${activityTitle}.`,
        timestamp: now,
        read: false,
      },
      {
        id: uid("ntf"),
        studentId: student.id,
        recipientRole: "Parent",
        channel: "SMS",
        type: "Registration Confirmed",
        title: "Registration confirmed",
        message: `USA-JHS: ${student.name} (${student.id}) registered for ${activityTitle}.`,
        timestamp: now,
        read: false,
      },
      {
        id: uid("ntf"),
        studentId: student.id,
        recipientRole: "Adviser",
        channel: "Push",
        type: "Registration Confirmed",
        title: `${student.name} registered`,
        message: `${student.id} joined ${activityTitle}.`,
        timestamp: now,
        read: false,
      },
    ];
  }
  if (kind === "checkin") {
    return [
      {
        id: uid("ntf"),
        studentId: student.id,
        recipientRole: "Student",
        channel: "In-App",
        type: "Attendance Check-In",
        title: `Checked in · ${activityTitle}`,
        message: `Campus verified. Attendance for ${student.id} was logged at ${activityTitle}.`,
        timestamp: now,
        read: false,
      },
      {
        id: uid("ntf"),
        studentId: student.id,
        recipientRole: "Parent",
        channel: "SMS",
        type: "Attendance Check-In",
        title: `Checked in: ${activityTitle}`,
        message: `USA-JHS: ${student.name} checked in at ${activityTitle}. Campus verified. ID ${student.id}.`,
        timestamp: now,
        read: false,
      },
      {
        id: uid("ntf"),
        studentId: student.id,
        recipientRole: "Adviser",
        channel: "Push",
        type: "Attendance Check-In",
        title: `${student.name} is on campus`,
        message: `${student.id} checked in to ${activityTitle}.`,
        timestamp: now,
        read: false,
      },
    ];
  }
  return [
    {
      id: uid("ntf"),
      studentId: student.id,
      recipientRole: "Parent",
      channel: "SMS",
      type: "Early-Warning Absence",
      title: `Early-warning: ${student.name}`,
      message: `USA-JHS: ${student.name} (${student.id}) reached ${ABSENCE_THRESHOLD} unexcused absences. Please contact the adviser.`,
      timestamp: now,
      read: false,
    },
    {
      id: uid("ntf"),
      studentId: student.id,
      recipientRole: "Adviser",
      channel: "In-App",
      type: "Early-Warning Absence",
      title: `THRESHOLD REACHED · ${student.name}`,
      message: `${student.id} hit ${ABSENCE_THRESHOLD} unexcused absences. Parent SMS sent to ${student.parentContact}.`,
      timestamp: now,
      read: false,
    },
    {
      id: uid("ntf"),
      studentId: student.id,
      recipientRole: "Student",
      channel: "Push",
      type: "Early-Warning Absence",
      title: "Absence notice",
      message: `Your record ${student.id} reached the early-warning threshold. Your parent and adviser were notified.`,
      timestamp: now,
      read: false,
    },
  ];
}

const seed = cloneSeed();

export const usePrototypeStore = create<PrototypeState>()(
  persist(
    (set, get) => ({
      role: "student",
      students: seed.students,
      activities: seed.activities,
      logs: seed.logs,
      notifications: seed.notifications,
      campusGeofence: true,
      focusStudentId: DEMO_STUDENT_ID,
      liveToken: null,
      staleToken: null,
      useStaleToken: false,
      lastScan: null,
      scanLog: [],
      toast: null,
      lookupId: null,
      hydrated: false,

      setRole: (role) => set({ role }),
      setHydrated: (v) => set({ hydrated: v }),

      resetDemo: () => {
        const fresh = cloneSeed();
        set({
          role: "student",
          students: fresh.students,
          activities: fresh.activities,
          logs: fresh.logs,
          notifications: fresh.notifications,
          campusGeofence: true,
          focusStudentId: DEMO_STUDENT_ID,
          liveToken: null,
          staleToken: null,
          useStaleToken: false,
          lastScan: null,
          scanLog: [],
          toast: null,
          lookupId: null,
        });
      },

      setCampusGeofence: (on) => set({ campusGeofence: on }),
      setFocusStudent: (id) => set({ focusStudentId: id, useStaleToken: false, staleToken: null }),

      issueLiveToken: (studentId) => {
        const id = studentId ?? get().focusStudentId;
        const now = Date.now();
        const token: QrToken = {
          studentId: id,
          token: randomToken(),
          issuedAt: now,
          expiresAt: now + QR_TTL_MS,
        };
        set({ liveToken: token, useStaleToken: false });
        return token;
      },

      simulateExpiredQr: (studentId) => {
        const id = studentId ?? get().focusStudentId;
        const token: QrToken = {
          studentId: id,
          token: `stale-${randomToken().slice(0, 8)}`,
          issuedAt: Date.now() - 120_000,
          expiresAt: Date.now() - 90_000,
        };
        set({ staleToken: token, useStaleToken: true });
        return token;
      },

      clearStale: () => set({ useStaleToken: false }),

      register: (studentId, activityId) => {
        const state = get();
        const activity = state.activities.find((a) => a.id === activityId);
        const student = state.students.find((s) => s.id === studentId);
        if (!activity || !student) return { ok: false, reason: "Unknown record." };
        if (!activity.requiresRegistration) return { ok: false, reason: "This notice does not take registration." };
        if (activity.status === "Completed") return { ok: false, reason: "Registration is closed." };
        const existing = state.logs.find((l) => l.studentId === studentId && l.activityId === activityId);
        if (existing?.registeredAt) return { ok: false, reason: "Already registered." };
        const now = new Date().toISOString();
        const nextLogs = existing
          ? state.logs.map((l) => (l.id === existing.id ? { ...l, registeredAt: now } : l))
          : [
              ...state.logs,
              {
                id: uid("log"),
                studentId,
                activityId,
                registeredAt: now,
                checkedInAt: null,
                verificationMethod: null,
                geofenceStatus: null,
              },
            ];
        const notes = fanOut(student, activity.title, "register", now);
        set({
          logs: nextLogs,
          notifications: [...notes, ...state.notifications],
          toast: notes[0],
        });
        return { ok: true };
      },

      verifyScan: (raw, method = "Dynamic QR") => {
        const state = get();
        const nowIso = new Date().toISOString();
        const fail = (partial: Omit<ScanResult, "id" | "at" | "activityId" | "method">): ScanResult => {
          const result: ScanResult = {
            ...partial,
            id: uid("scan"),
            at: nowIso,
            activityId: LIVE_ACTIVITY_ID,
            method,
          };
          set({ lastScan: result, scanLog: [result, ...state.scanLog].slice(0, 8) });
          return result;
        };

        let payload: QrToken | null = null;
        const trimmed = raw.trim();
        if (trimmed.startsWith("{")) {
          try {
            payload = JSON.parse(trimmed) as QrToken;
          } catch {
            payload = null;
          }
        }

        if (!payload?.studentId || !payload.token || !payload.expiresAt) {
          return fail({
            kind: "unknown",
            studentId: null,
            studentName: null,
            message: "Unreadable code. Expected a ONE ID payload { studentId, token, expiresAt }.",
          });
        }

        const student = state.students.find((s) => s.id === payload.studentId);
        if (!student) {
          return fail({
            kind: "unknown",
            studentId: payload.studentId,
            studentName: null,
            message: `No JHS record for ${payload.studentId}.`,
          });
        }

        if (!state.campusGeofence) {
          return fail({
            kind: "off-campus",
            studentId: student.id,
            studentName: student.name,
            message: "Location Mismatch: Check-in restricted to USA JHS Campus.",
          });
        }

        if (Date.now() > payload.expiresAt) {
          return fail({
            kind: "expired",
            studentId: student.id,
            studentName: student.name,
            message: "Proxy Alert: Expired QR Token. Please refresh student ID.",
          });
        }

        const already = state.logs.find(
          (l) => l.studentId === student.id && l.activityId === LIVE_ACTIVITY_ID && l.checkedInAt
        );
        if (already) {
          return fail({
            kind: "duplicate",
            studentId: student.id,
            studentName: student.name,
            message: `${student.name} is already checked in to the Science & Tech Fair.`,
          });
        }

        const existing = state.logs.find((l) => l.studentId === student.id && l.activityId === LIVE_ACTIVITY_ID);
        const nextLogs: AttendanceLog[] = existing
          ? state.logs.map((l) =>
              l.id === existing.id
                ? {
                    ...l,
                    registeredAt: l.registeredAt ?? nowIso,
                    checkedInAt: nowIso,
                    verificationMethod: method,
                    geofenceStatus: "Campus Verified",
                  }
                : l
            )
          : [
              ...state.logs,
              {
                id: uid("log"),
                studentId: student.id,
                activityId: LIVE_ACTIVITY_ID,
                registeredAt: nowIso,
                checkedInAt: nowIso,
                verificationMethod: method,
                geofenceStatus: "Campus Verified",
              },
            ];

        const activity = state.activities.find((a) => a.id === LIVE_ACTIVITY_ID)!;
        const notes = fanOut(student, activity.title, "checkin", nowIso);
        const result: ScanResult = {
          id: uid("scan"),
          kind: "valid",
          studentId: student.id,
          studentName: student.name,
          activityId: LIVE_ACTIVITY_ID,
          message: `${student.name} · campus verified · parent and student notified.`,
          at: nowIso,
          method,
        };
        set({
          logs: nextLogs,
          notifications: [...notes, ...state.notifications],
          toast: notes.find((n) => n.recipientRole === "Parent") ?? notes[0],
          lastScan: result,
          scanLog: [result, ...state.scanLog].slice(0, 8),
          useStaleToken: false,
        });
        return result;
      },

      manualCheckIn: (studentId) => {
        const student = get().students.find((s) => s.id === studentId.trim());
        if (!student) {
          const result: ScanResult = {
            id: uid("scan"),
            kind: "unknown",
            studentId: studentId.trim() || null,
            studentName: null,
            activityId: LIVE_ACTIVITY_ID,
            message: "No student matches that ID.",
            at: new Date().toISOString(),
            method: "Manual ID Fallback",
          };
          set({ lastScan: result, scanLog: [result, ...get().scanLog].slice(0, 8) });
          return result;
        }
        const live: QrToken = {
          studentId: student.id,
          token: "manual-fallback",
          issuedAt: Date.now(),
          expiresAt: Date.now() + QR_TTL_MS,
        };
        return get().verifyScan(JSON.stringify(live), "Manual ID Fallback");
      },

      logAbsence: (studentId) => {
        const state = get();
        const student = state.students.find((s) => s.id === studentId);
        if (!student) return;
        const nextCount = student.absenceCount + 1;
        const students = state.students.map((s) =>
          s.id === studentId ? { ...s, absenceCount: nextCount } : s
        );
        const crossed = student.absenceCount < ABSENCE_THRESHOLD && nextCount >= ABSENCE_THRESHOLD;
        if (!crossed) {
          set({ students });
          return;
        }
        const now = new Date().toISOString();
        const updated = students.find((s) => s.id === studentId)!;
        const notes = fanOut(updated, "", "absence", now);
        set({
          students,
          notifications: [...notes, ...state.notifications],
          toast: notes[0],
        });
      },

      markRead: (id) =>
        set({
          notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }),

      dismissToast: () => set({ toast: null }),
      openLookup: (id) => set({ lookupId: id }),
    }),
    {
      name: "one-id-one-connect",
      partialize: (s) => ({
        role: s.role,
        students: s.students,
        activities: s.activities,
        logs: s.logs,
        notifications: s.notifications,
        campusGeofence: s.campusGeofence,
        focusStudentId: s.focusStudentId,
        scanLog: s.scanLog,
      }),
    }
  )
);
