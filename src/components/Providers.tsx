"use client";

import { useEffect } from "react";
import { usePrototypeStore } from "@/store/usePrototypeStore";
import { DemoSwitcherBar } from "@/components/DemoSwitcherBar";
import { NotificationToast } from "@/components/NotificationToast";
import { Student360Modal } from "@/components/Student360Modal";

export function Providers({ children }: { children: React.ReactNode }) {
  const setHydrated = usePrototypeStore((s) => s.setHydrated);

  useEffect(() => {
    const unsub = usePrototypeStore.persist.onFinishHydration(() => setHydrated(true));
    if (usePrototypeStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, [setHydrated]);

  return (
    <>
      {children}
      <NotificationToast />
      <Student360Modal />
      <DemoSwitcherBar />
    </>
  );
}
