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
        "rounded-lg border border-border/70 bg-card/70 px-1 py-1 shadow-sm backdrop-blur-sm sm:px-2 sm:py-2",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-4", contentClassName)}>
        {/* Main Content Layer: Title, Navigation and Actions */}
        <div className="flex flex-col gap-1.5 sm:flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {mobileMenuTrigger ? <MobileMenuTrigger /> : null}
              {backAction ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
                  onClick={backAction.onClick}
                >
                  {backAction.label}
                </Button>
              ) : null}
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
                  headingClassName,
                )}
              >
                {title}
              </h1>
            </div>

            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {actions}
              </div>
            ) : null}
          </div>

          {subtitle ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Supplementary Layer: Breadcrumbs and Meta */}
        {(breadcrumbs || meta) && (
          <div className="flex flex-col gap-3 ml-12 sm:ml-1">
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
        )}
      </div>
    </header>
  );
}
