"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { students } from "@/lib/seed";

export default function ParentSignupForm() {
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { registerParent } = useAuthStore();

  // Validate student ID exists in roster
  const validateStudentId = () => {
    const valid = students.some((s: typeof students[0]) => s.id === studentId);
    return valid ? "" : "Student ID not found in roster";
  };

  // Validate password strength
  const validatePassword = () => {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const studentIdError = validateStudentId();
    const passwordError = validatePassword();

    if (studentIdError || passwordError) {
      setErrors({
        ...errors,
        studentId: studentIdError,
        password: passwordError,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await registerParent({
        name: parentName,
        email,
        phone,
        studentId,
        pass: password,
      });

      if (result.ok) {
        // Success: redirect to login with confirmation
        router.push("/login");
      } else {
        setErrors({ ...errors, general: result.error || "Registration failed" });
      }
    } catch (err) {
      setErrors({ ...errors, general: "Network error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <label className="block text-sm font-medium text-ink">Parent Name</label>
        <input
          type="text"
          name="parentName"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Email</label>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
          required
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Phone</label>
        <input
          type="tel"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
          placeholder="+1 (555) 123-4567"
          required
        />
        {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Student ID</label>
        <input
          type="text"
          name="studentId"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
          required
        />
        {errors.studentId && <p className="text-sm text-red-600">{errors.studentId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Password</label>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
          required
        />
        {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-maroon"
          required
        />
        {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>

      {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}

      <button
        type="submit"
        disabled={isSubmitting || Object.keys(errors).length > 0}
        className="w-full rounded-full bg-maroon py-2.5 text-sm font-semibold text-white hover:bg-maroon/90 disabled:opacity-50 transition"
      >
        {isSubmitting ? "Creating Account..." : "Sign Up"}
      </button>
    </form>
  );
}