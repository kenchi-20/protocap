-- Users table: demo auth (passwords in plain text for prototype only)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Demo only: plain text. NEVER in production.
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'security', 'admin')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-child link: maps parent user to student IDs
CREATE TABLE parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  UNIQUE(parent_user_id, student_id)
);

-- Teacher-section link: maps teacher user to grade sections they advise
CREATE TABLE teacher_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  grade_section TEXT NOT NULL,
  UNIQUE(teacher_user_id, grade_section)
);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_sections ENABLE ROW LEVEL SECURITY;

-- For prototype: allow anon read/write on all tables
CREATE POLICY "anon_full_access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access" ON parent_children FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access" ON teacher_sections FOR ALL USING (true) WITH CHECK (true);
