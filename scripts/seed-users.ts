// Seed script for demo users and role links
// Usage: npx tsx --env-file=.env.local scripts/seed-users.ts

import { supabase } from "../src/lib/supabase";

async function seedUsers() {
  // Demo users
  const users = [
    { email: "maria@parent.test", password: "parent123", role: "parent", name: "Mrs. Maria Dela Cruz" },
    { email: "paulo@parent.test", password: "parent123", role: "parent", name: "Mr. Paulo Villanueva" },
    { email: "liza@parent.test", password: "parent123", role: "parent", name: "Mrs. Liza Santos" },
    { email: "elena@parent.test", password: "parent123", role: "parent", name: "Mrs. Elena Ramirez" },
    { email: "henry@parent.test", password: "parent123", role: "parent", name: "Mr. Henry Tan" },
    { email: "osalla@teacher.test", password: "teacher123", role: "teacher", name: "Ms. Rovilyn Osalla" },
    { email: "bautista@teacher.test", password: "teacher123", role: "teacher", name: "Mr. Carlo Bautista" },
    { email: "flores@teacher.test", password: "teacher123", role: "teacher", name: "Ms. Diane Flores" },
    { email: "navarro@teacher.test", password: "teacher123", role: "teacher", name: "Mr. Joel Navarro" },
    { email: "security@admin.test", password: "admin123", role: "security", name: "Security Desk" },
    { email: "principal@admin.test", password: "admin123", role: "admin", name: "Principal Desk" },
  ];

  const { data: insertedUsers, error: userError } = await supabase
    .from("users")
    .upsert(users, { onConflict: "email" })
    .select();

  if (userError) {
    console.error("Error inserting users:", userError);
    return;
  }

  console.log(`Inserted ${insertedUsers.length} users`);

  // Parent-children links (map parent email to student by parentName match)
  const parentChildren = [
    { parentEmail: "maria@parent.test", studentId: "USA-JHS-2026-0104" }, // Juan Dela Cruz
    { parentEmail: "paulo@parent.test", studentId: "USA-JHS-2026-0088" }, // Andrea Mae Villanueva
    { parentEmail: "liza@parent.test", studentId: "USA-JHS-2026-0117" }, // Miguel Santos
    { parentEmail: "elena@parent.test", studentId: "USA-JHS-2026-0062" }, // Sofia Ramirez
    { parentEmail: "henry@parent.test", studentId: "USA-JHS-2026-0142" }, // Gabriel Tan
  ];

  const parentChildrenRows = parentChildren.map(link => {
    const user = insertedUsers.find(u => u.email === link.parentEmail);
    return { parent_user_id: user!.id, student_id: link.studentId };
  });

  const { error: pcError } = await supabase.from("parent_children").upsert(parentChildrenRows);
  if (pcError) console.error("Error inserting parent_children:", pcError);
  else console.log("Inserted parent-children links");

  // Teacher-section links
  const teacherSections = [
    { teacherEmail: "osalla@teacher.test", gradeSection: "Grade 9 - St. Augustine" },
    { teacherEmail: "osalla@teacher.test", gradeSection: "Grade 9 - St. Nicholas" },
    { teacherEmail: "bautista@teacher.test", gradeSection: "Grade 8 - St. Monica" },
    { teacherEmail: "flores@teacher.test", gradeSection: "Grade 10 - St. Thomas" },
    { teacherEmail: "flores@teacher.test", gradeSection: "Grade 10 - St. Joseph" },
    { teacherEmail: "navarro@teacher.test", gradeSection: "Grade 7 - St. Rita" },
  ];

  const teacherSectionsRows = teacherSections.map(link => {
    const user = insertedUsers.find(u => u.email === link.teacherEmail);
    return { teacher_user_id: user!.id, grade_section: link.gradeSection };
  });

  const { error: tsError } = await supabase.from("teacher_sections").upsert(teacherSectionsRows);
  if (tsError) console.error("Error inserting teacher_sections:", tsError);
  else console.log("Inserted teacher-section links");

  console.log("Seed complete!");
}

seedUsers();