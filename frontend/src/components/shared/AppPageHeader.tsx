import type { ReactNode } from "react";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface AppPageHeaderAction {
  label: string;
  onClick: () => void;
}

interface AppPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  backAction?: AppPageHeaderAction;
  mobileMenuTrigger?: boolean;
  className?: string;
  contentClassName?: string;
  headingClassName?: string;
}

function MobileMenuTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="rounded-xl border-border/70 bg-background/90 shadow-sm md:hidden"
      onClick={toggleSidebar}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  );
}

export default function AppPageHeader({
  title,
  subtitle,
  breadcrumbs,
  meta,
  actions,
  backAction,
  mobileMenuTrigger = false,
  className,
  contentClassName,
  headingClassName,
}: AppPageHeaderProps) {
  return (
    <header
      className={cn(
        "rounded-[1.75rem] border border-border/70 bg-card/70 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5 sm:py-5",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-4", contentClassName)}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3 md:hidden">
              <div className="flex min-w-0 items-center gap-3">
                {mobileMenuTrigger ? <MobileMenuTrigger /> : null}
                <div className="min-w-0">
                  <h1
                    className={cn(
                      "truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
                      headingClassName,
                    )}
                  >
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              {actions ? (
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  {actions}
                </div>
              ) : null}
            </div>

            <div className="hidden space-y-1 md:block">
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight text-foreground sm:text-3xl ",
                  headingClassName,
                )}
              >
                {title}
              </h1>
              {subtitle ? (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {backAction ? (
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 rounded-xl px-2.5 text-muted-foreground"
                  onClick={backAction.onClick}
                >
                  {backAction.label}
                </Button>
              </div>
            ) : null}

            {breadcrumbs ? (
              <div className="min-w-0 overflow-hidden text-xs text-muted-foreground sm:text-sm">
                {breadcrumbs}
              </div>
            ) : null}

            {meta ? (
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                {meta}
              </div>
            ) : null}
          </div>

          {actions ? (
            <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 md:flex">
              {actions}
            </div>
          ) : null}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {mobileMenuTrigger ? <MobileMenuTrigger /> : null}
          {backAction ? (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 rounded-xl px-2.5 text-muted-foreground"
              onClick={backAction.onClick}
            >
              {backAction.label}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
