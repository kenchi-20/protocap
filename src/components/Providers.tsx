"use client";

import { useEffect } from "react";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { DemoSwitcherBar } from "@/components/DemoSwitcherBar";
import { NotificationToast } from "@/components/NotificationToast";
import { Student360Modal } from "@/components/Student360Modal";

export function Providers({ children }: { children: React.ReactNode }) {
  const setHydrated = usePrototypeStore((s) => s.setHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    const unsub = usePrototypeStore.persist.onFinishHydration(() => setHydrated(true));
    if (usePrototypeStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, [setHydrated]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      {children}
      <NotificationToast />
      <Student360Modal />
      <DemoSwitcherBar />
    </>
  );
}
