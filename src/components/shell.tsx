import type { ReactNode } from "react";
import { BottomNav } from "@/components/nav";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-6">{children}</div>
      <BottomNav />
    </div>
  );
}
