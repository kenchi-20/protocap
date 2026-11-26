"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { students } from "@/lib/seed";
import { Check, AlertCircle } from "lucide-react";

export default function ParentSignupForm() {
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const router = useRouter();
  const { registerParent } = useAuthStore();

  // Validate student ID exists in roster (real-time)
  const validateStudentId = (value: string) => {
    if (!value) return "";
    const valid = students.some((s: typeof students[0]) => s.id === value);
    return valid ? "" : "Student ID not found in roster";
  };

  // Validate email format (real-time)
  const validateEmail = (value: string) => {
    if (!value) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? "" : "Invalid email format";
  };

  // Validate phone format (real-time)
  const validatePhone = (value: string) => {
    if (!value) return "";
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(value) ? "" : "Invalid phone number";
  };

  // Validate password strength (real-time)
  const validatePassword = (value: string) => {
    if (!value) return "";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  // Validate confirm password (real-time)
  const validateConfirmPassword = (value: string) => {
    if (!value) return "";
    if (value !== password) return "Passwords do not match";
    return "";
  };

  // Real-time validation on blur
  const handleBlur = (field: string, value: string, validator: (v: string) => string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validator(value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    const studentIdError = validateStudentId(studentId);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    const parentNameError = parentName.trim() ? "" : "Parent name is required";

    if (parentNameError) newErrors.parentName = parentNameError;
    if (emailError) newErrors.email = emailError;
    if (phoneError) newErrors.phone = phoneError;
    if (studentIdError) newErrors.studentId = studentIdError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    // Mark all fields as touched
    setTouched({
      parentName: true,
      email: true,
      phone: true,
      studentId: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        setSubmitSuccess(true);
        // Redirect after brief success animation
        setTimeout(() => {
          router.push("/login");
        }, 800);
      } else {
        setErrors((prev) => ({ ...prev, general: result.error || "Registration failed" }));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, general: "Network error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: "parentName", label: "Parent Name", type: "text", value: parentName, onChange: setParentName, validator: (v: string) => v.trim() ? "" : "Parent name is required", placeholder: "" },
    { name: "email", label: "Email", type: "email", value: email, onChange: setEmail, validator: validateEmail, placeholder: "you@example.test" },
    { name: "phone", label: "Phone", type: "tel", value: phone, onChange: setPhone, validator: validatePhone, placeholder: "+1 (555) 123-4567" },
    { name: "studentId", label: "Student ID", type: "text", value: studentId, onChange: setStudentId, validator: validateStudentId, placeholder: "USA-JHS-2026-XXXX" },
    { name: "password", label: "Password", type: "password", value: password, onChange: setPassword, validator: validatePassword, placeholder: "••••••••" },
    { name: "confirmPassword", label: "Confirm Password", type: "password", value: confirmPassword, onChange: setConfirmPassword, validator: validateConfirmPassword, placeholder: "••••••••" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", bounce: 0, duration: 0.4 },
    },
  };

  const errorVariants: Variants = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0, transition: { duration: 150, ease: [0.23, 1, 0.32, 1] } },
  };

  const iconVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.2, duration: 0.25 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 120 } },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
    >
      <AnimatePresence mode="wait">
        {submitSuccess && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-800">Account Created!</p>
              <p className="text-sm text-green-700">Redirecting to sign in...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {fields.map((field, index) => (
        <motion.div
          key={field.name}
          variants={fieldVariants}
          className="relative"
        >
          <label className="block text-sm font-medium text-ink mb-1">{field.label}</label>
          <div className="relative">
            <input
              type={field.type}
              name={field.name}
              value={field.value}
              onChange={(e) => {
                field.onChange(e.target.value);
                // Clear error on typing
                if (errors[field.name]) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.name];
                    return next;
                  });
                }
              }}
              onBlur={(e) => handleBlur(field.name, e.target.value, field.validator)}
              className={`
                w-full rounded-lg border pe-[40px] px-3 py-2.5 text-sm outline-none transition-colors duration-200 ease-out
                ${touched[field.name] && errors[field.name]
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 bg-red-50"
                  : "border-slate-200 focus:border-maroon focus:ring-1 focus:ring-maroon/20"
                }
                ${touched[field.name] && !errors[field.name] && field.value
                  ? "border-green-400"
                  : ""
                }
                ${isSubmitting ? "opacity-50 pointer-events-none" : ""}
              `}
              placeholder={field.placeholder}
              required
              autoComplete={field.name === "password" ? "new-password" : field.name}
              disabled={isSubmitting || submitSuccess}
            />
            {/* Validation icon */}
            <AnimatePresence>
              {touched[field.name] && field.value && (
                <motion.div
                  key="icon"
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {errors[field.name] ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {touched[field.name] && errors[field.name] && (
              <motion.p
                key="error"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="mt-2 text-sm text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {errors[field.name]}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      <AnimatePresence>
        {errors.general && (
          <motion.p
            key="general-error"
            variants={errorVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mt-2 text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {errors.general}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={isSubmitting || submitSuccess}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.46 }}
        className={`
          w-full rounded-full bg-maroon py-3 text-sm font-semibold text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon focus-visible:ring-offset-2
          transition-colors duration-200 ease-out
          ${isSubmitting || submitSuccess ? "bg-maroon/70 cursor-wait" : "hover:bg-maroon/90"}
        `}
      >
        {isSubmitting ? (
          <>
            <svg
              className="mr-2 inline-block h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            Creating Account...
          </>
        ) : submitSuccess ? (
          <>
            <Check className="mr-2 h-5 w-5" />
            Account Created!
          </>
        ) : (
          "Sign Up"
        )}
      </motion.button>
    </motion.form>
  );
}