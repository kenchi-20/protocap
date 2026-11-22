import { supabase } from "@/lib/supabase";
import type { Student } from "@/types";

export async function fetchChildrenForParent(parentUserId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("parent_children")
    .select("student_id")
    .eq("parent_user_id", parentUserId);

  if (error || !data) return [];
  return data.map((row) => row.student_id);
}

export async function fetchSectionsForTeacher(teacherUserId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("teacher_sections")
    .select("grade_section")
    .eq("teacher_user_id", teacherUserId);

  if (error || !data) return [];
  return data.map((row) => row.grade_section);
}

export async function fetchStudentsByIds(studentIds: string[]): Promise<Student[]> {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .in("id", studentIds);

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

export async function fetchStudentsBySections(sections: string[]): Promise<Student[]> {
  if (sections.length === 0) return [];
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .in("grade_section", sections);

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