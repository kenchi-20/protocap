// Seed script for demo users and role links
// Usage: npx tsx --env-file=.env.local scripts/seed-users.ts
// Demo only: plain text. NEVER in production.

import { supabase } from "../src/lib/supabase";
import { students } from "../src/lib/seed";

async function seedUsers() {
  // Demo users
  // Demo only: plain text. NEVER in production.
  const users = [
    // Parent users
    { email: "maria@parent.test", password: "parent123" /* Demo only: plain text. NEVER in production. */, role: "parent", name: "Mrs. Maria Dela Cruz" },
    { email: "paulo@parent.test", password: "parent123" /* Demo only: plain text. NEVER in production. */, role: "parent", name: "Mr. Paulo Villanueva" },
    { email: "liza@parent.test", password: "parent123" /* Demo only: plain text. NEVER in production. */, role: "parent", name: "Mrs. Liza Santos" },
    { email: "elena@parent.test", password: "parent123" /* Demo only: plain text. NEVER in production. */, role: "parent", name: "Mrs. Elena Ramirez" },
    { email: "henry@parent.test", password: "parent123" /* Demo only: plain text. NEVER in production. */, role: "parent", name: "Mr. Henry Tan" },
    // Teacher users
    { email: "osalla@teacher.test", password: "teacher123" /* Demo only: plain text. NEVER in production. */, role: "teacher", name: "Ms. Rovilyn Osalla" },
    { email: "bautista@teacher.test", password: "teacher123" /* Demo only: plain text. NEVER in production. */, role: "teacher", name: "Mr. Carlo Bautista" },
    { email: "flores@teacher.test", password: "teacher123" /* Demo only: plain text. NEVER in production. */, role: "teacher", name: "Ms. Diane Flores" },
    { email: "navarro@teacher.test", password: "teacher123" /* Demo only: plain text. NEVER in production. */, role: "teacher", name: "Mr. Joel Navarro" },
    // Security users
    { email: "security@admin.test", password: "admin123" /* Demo only: plain text. NEVER in production. */, role: "security", name: "Security Desk" },
    // Admin users
    { email: "principal@admin.test", password: "admin123" /* Demo only: plain text. NEVER in production. */, role: "admin", name: "Principal Desk" },
    // Student users
    { email: "juan@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Juan Dela Cruz", student_id: "USA-JHS-2026-0104" },
    { email: "andrea@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Andrea Mae Villanueva", student_id: "USA-JHS-2026-0088" },
    { email: "miguel@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Miguel Santos", student_id: "USA-JHS-2026-0117" },
    { email: "sofia@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Sofia Ramirez", student_id: "USA-JHS-2026-0062" },
    { email: "gabriel@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Gabriel Tan", student_id: "USA-JHS-2026-0142" },
    { email: "isabella@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Isabella Cruz", student_id: "USA-JHS-2026-0091" },
    { email: "luis@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Luis Mendoza", student_id: "USA-JHS-2026-0203" },
    { email: "patricia@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Patricia Ong", student_id: "USA-JHS-2026-0074" },
    { email: "rafael@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Rafael Aquino", student_id: "USA-JHS-2026-0188" },
    { email: "camille@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Camille Reyes", student_id: "USA-JHS-2026-0125" },
    { email: "nathan@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Nathan dela Peña", student_id: "USA-JHS-2026-0160" },
    { email: "hannah@student.test", password: "student123" /* Demo only: plain text. NEVER in production. */, role: "student", name: "Hannah Go", student_id: "USA-JHS-2026-0055" },
  ];

  const { data: insertedUsers, error: userError } = await supabase
    .from("users")
    .upsert(users, { onConflict: "email" })
    .select();

  if (userError || !insertedUsers) {
    console.error("Error inserting users:", userError);
    return;
  }

  console.log(`Inserted ${insertedUsers.length} users`);

  // Parent-children links (reference students from src/lib/seed)
  const parentChildren = [
    { parentEmail: "maria@parent.test", student: students.find(s => s.parentName === "Mrs. Maria Dela Cruz") },
    { parentEmail: "paulo@parent.test", student: students.find(s => s.parentName === "Mr. Paulo Villanueva") },
    { parentEmail: "liza@parent.test", student: students.find(s => s.parentName === "Mrs. Liza Santos") },
    { parentEmail: "elena@parent.test", student: students.find(s => s.parentName === "Mrs. Elena Ramirez") },
    { parentEmail: "henry@parent.test", student: students.find(s => s.parentName === "Mr. Henry Tan") },
  ];

  const parentChildrenRows = parentChildren.map(link => {
    if (!link.student) {
      throw new Error(`Student not found for parent: ${link.parentEmail}`);
    }
    const user = insertedUsers.find(u => u.email === link.parentEmail);
    if (!user) {
      throw new Error(`Parent user not found for email: ${link.parentEmail}`);
    }
    return { parent_user_id: user.id, student_id: link.student.id };
  });

  const { error: pcError } = await supabase.from("parent_children").upsert(parentChildrenRows, { onConflict: "parent_user_id, student_id" });
  if (pcError) console.error("Error inserting parent_children:", pcError);
  else console.log("Inserted parent-children links");

  // Teacher-section links (reference valid grade sections from students)
  const validSections = new Set(students.map(s => s.gradeSection));
  const teacherSections = [
    { teacherEmail: "osalla@teacher.test", gradeSection: "Grade 9 - St. Augustine" },
    { teacherEmail: "osalla@teacher.test", gradeSection: "Grade 9 - St. Nicholas" },
    { teacherEmail: "bautista@teacher.test", gradeSection: "Grade 8 - St. Monica" },
    { teacherEmail: "flores@teacher.test", gradeSection: "Grade 10 - St. Thomas" },
    { teacherEmail: "flores@teacher.test", gradeSection: "Grade 10 - St. Joseph" },
    { teacherEmail: "navarro@teacher.test", gradeSection: "Grade 7 - St. Rita" },
  ];

  for (const ts of teacherSections) {
    if (!validSections.has(ts.gradeSection)) {
      throw new Error(`Invalid section referenced from students: ${ts.gradeSection}`);
    }
  }

  const teacherSectionsRows = teacherSections.map(link => {
    const user = insertedUsers.find(u => u.email === link.teacherEmail);
    if (!user) {
      throw new Error(`Teacher user not found for email: ${link.teacherEmail}`);
    }
    return { teacher_user_id: user.id, grade_section: link.gradeSection };
  });

  const { error: tsError } = await supabase.from("teacher_sections").upsert(teacherSectionsRows, { onConflict: "teacher_user_id, grade_section" });
  if (tsError) console.error("Error inserting teacher_sections:", tsError);
  else console.log("Inserted teacher-section links");

  console.log("Seed complete!");
}

seedUsers();
