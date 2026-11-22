export type Role = "student" | "parent" | "admin";

export type UserRole = "parent" | "teacher" | "security" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface ParentChildLink {
  parentUserId: string;
  studentId: string;
}

export interface TeacherSectionLink {
  teacherUserId: string;
  gradeSection: string;
}

export type ActivityCategory =
  | "Academic"
  | "Co-Curricular"
  | "Campus Announcement"
  | "Assembly";

export type ActivityStatus = "Open" | "Ongoing" | "Completed";

export type VerificationMethod = "Dynamic QR" | "Manual ID Fallback";

export type GeofenceStatus = "Campus Verified" | "Off-Campus Blocked";

export type RecipientRole = "Student" | "Parent" | "Adviser";

export type Channel = "In-App" | "Push" | "SMS";

export type NotificationType =
  | "Event Alert"
  | "Registration Confirmed"
  | "Attendance Check-In"
  | "Early-Warning Absence";

export interface Student {
  id: string;
  name: string;
  gradeSection: string;
  parentName: string;
  parentContact: string;
  adviserName: string;
  consentVerified: boolean;
  absenceCount: number;
  avatarInitials: string;
}

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  date: string;
  time: string;
  venue: string;
  deadline: string;
  requiresRegistration: boolean;
  status: ActivityStatus;
  description: string;
  capacity: number;
}

export interface AttendanceLog {
  id: string;
  studentId: string;
  activityId: string;
  registeredAt: string | null;
  checkedInAt: string | null;
  verificationMethod: VerificationMethod | null;
  geofenceStatus: GeofenceStatus | null;
}

export interface NotificationLog {
  id: string;
  studentId: string;
  recipientRole: RecipientRole;
  channel: Channel;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface QrToken {
  studentId: string;
  token: string;
  expiresAt: number;
  issuedAt: number;
}

export type ScanResultKind = "valid" | "expired" | "off-campus" | "unknown" | "duplicate";

export interface ScanResult {
  id: string;
  kind: ScanResultKind;
  studentId: string | null;
  studentName: string | null;
  activityId: string;
  message: string;
  at: string;
  method: VerificationMethod;
}

export const ABSENCE_THRESHOLD = 3;
export const QR_TTL_MS = 30_000;
export const DEMO_STUDENT_ID = "USA-JHS-2026-0104";
export const LIVE_ACTIVITY_ID = "act-science-fair";
