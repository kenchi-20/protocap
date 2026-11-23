"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "teacher")) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "teacher") {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return <>{children}</>;
}