import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppPageShellWidth = "form" | "default" | "wide" | "full";

interface AppPageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  width?: AppPageShellWidth;
  gap?: "tight" | "default" | "loose";
}

const widthClasses: Record<AppPageShellWidth, string> = {
  form: "max-w-4xl",
  default: "max-w-6xl",
  wide: "max-w-7xl 2xl:max-w-[92rem]",
  full: "max-w-none",
};

const gapClasses = {
  tight: "gap-4 md:gap-5",
  default: "gap-5 md:gap-6",
  loose: "gap-6 md:gap-8",
};

export default function AppPageShell({
  children,
  className,
  contentClassName,
  width = "default",
  gap = "tight",
}: AppPageShellProps) {
  return (
    <section
      className={cn(
        "w-full px-3 pb-5 pt-3 sm:px-2 md:px-3.5 md:pb-3 md:pt-2 lg:px-3 lg:pb-4",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col",
          widthClasses[width],
          gapClasses[gap],
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
