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
        "rounded-[1.75rem] border border-border/70 bg-card/70 px-2 py-2 shadow-sm backdrop-blur-sm sm:px-3 sm:py-3",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-4", contentClassName)}>
        {/* Navigation Layer: Trigger and Back Action */}
        {(mobileMenuTrigger || backAction) && (
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
          </div>
        )}

        {/* Main Content Layer: Title and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1
              className={cn(
                "text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
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

          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:justify-end">
              {actions}
            </div>
          ) : null}
        </div>

        {/* Supplementary Layer: Breadcrumbs and Meta */}
        {(breadcrumbs || meta) && (
          <div className="flex flex-col gap-3">
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
