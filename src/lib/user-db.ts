import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { students as seedStudents } from "@/lib/seed";
import type { Student } from "@/types";

export async function fetchChildrenForParent(parentUserId: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return demoParentChildren(parentUserId);
  }
  try {
    const { data, error } = await supabase
      .from("parent_children")
      .select("student_id")
      .eq("parent_user_id", parentUserId);

    if (error || !data) {
      return demoParentChildren(parentUserId);
    }
    return data.map((row) => row.student_id);
  } catch {
    return demoParentChildren(parentUserId);
  }
}

export async function fetchSectionsForTeacher(teacherUserId: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return demoTeacherSections(teacherUserId);
  }
  try {
    const { data, error } = await supabase
      .from("teacher_sections")
      .select("grade_section")
      .eq("teacher_user_id", teacherUserId);

    if (error || !data) {
      return demoTeacherSections(teacherUserId);
    }
    return data.map((row) => row.grade_section);
  } catch {
    return demoTeacherSections(teacherUserId);
  }
}

function demoParentChildren(userId: string): string[] {
  const map: Record<string, string[]> = {
    "usr-maria": ["USA-JHS-2026-0104"],
    "usr-paulo": ["USA-JHS-2026-0088"],
    "usr-liza": ["USA-JHS-2026-0117"],
    "usr-elena": ["USA-JHS-2026-0062"],
    "usr-henry": ["USA-JHS-2026-0142"],
  };
  return map[userId] ?? [];
}

function demoTeacherSections(userId: string): string[] {
  const map: Record<string, string[]> = {
    "usr-osalla": ["Grade 9 - St. Augustine", "Grade 9 - St. Nicholas"],
    "usr-bautista": ["Grade 8 - St. Monica"],
    "usr-flores": ["Grade 10 - St. Thomas", "Grade 10 - St. Joseph"],
    "usr-navarro": ["Grade 7 - St. Rita"],
  };
  return map[userId] ?? [];
}

export async function fetchStudentsByIds(studentIds: string[]): Promise<Student[]> {
  if (studentIds.length === 0) return [];
  if (!isSupabaseConfigured) {
    return seedStudents.filter((s) => studentIds.includes(s.id));
  }
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .in("id", studentIds);

    if (error || !data || data.length === 0) {
      return seedStudents.filter((s) => studentIds.includes(s.id));
    }
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      gradeSection: row.grade_section,
      parentName: row.parent_name,
      parentContact: row.parent_contact,
      adviserName: row.adviser_name,
      consentVerified: row.consent_verified,
      absenceCount: row.absence_count,
      avatarInitials: row.avatar_initials,
    }));
  } catch {
    return seedStudents.filter((s) => studentIds.includes(s.id));
  }
}

export async function fetchStudentsBySections(sections: string[]): Promise<Student[]> {
  if (sections.length === 0) return [];
  if (!isSupabaseConfigured) {
    return seedStudents.filter((s) => sections.includes(s.gradeSection));
  }
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .in("grade_section", sections);

    if (error || !data || data.length === 0) {
      return seedStudents.filter((s) => sections.includes(s.gradeSection));
    }
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      gradeSection: row.grade_section,
      parentName: row.parent_name,
      parentContact: row.parent_contact,
      adviserName: row.adviser_name,
      consentVerified: row.consent_verified,
      absenceCount: row.absence_count,
      avatarInitials: row.avatar_initials,
    }));
  } catch {
    return seedStudents.filter((s) => sections.includes(s.gradeSection));
  }
}

export async function fetchAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("*");
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    gradeSection: row.grade_section,
    parentName: row.parent_name,
    parentContact: row.parent_contact,
    adviserName: row.adviser_name,
    consentVerified: row.consent_verified,
    absenceCount: row.absence_count,
    avatarInitials: row.avatar_initials,
  }));
}