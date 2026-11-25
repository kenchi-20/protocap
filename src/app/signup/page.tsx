"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import ParentSignupForm from "@/components/ParentSignupForm";

export default function SignupPage() {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", bounce: 0, duration: 0.4 },
    },
  };

  return (
    <>
      <AppHeader eyebrow="Parent Portal" title="Create Parent Account" subtitle="Link your account to your child's Junior High student ID" />
      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mx-auto max-w-md px-4 py-8"
      >
        <motion.div variants={itemVariants} className="mb-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon hover:underline transition-transform active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign in
          </Link>
        </motion.div>
        <motion.div variants={itemVariants}>
          <ParentSignupForm />
        </motion.div>
      </motion.main>
    </>
  );
}