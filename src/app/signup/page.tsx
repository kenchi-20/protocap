"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import ParentSignupForm from "@/components/ParentSignupForm";

export default function SignupPage() {
  return (
    <>
      <AppHeader eyebrow="Parent Portal" title="Create Parent Account" subtitle="Link your account to your child's Junior High student ID" />
      <main className="mx-auto max-w-md px-4 py-8">
        <div className="mb-4">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign in
          </Link>
        </div>
        <ParentSignupForm />
      </main>
    </>
  );
}