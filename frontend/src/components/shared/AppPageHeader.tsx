import type { ReactNode } from "react";

import { Menu, PanelLeftOpen, PanelLeftClose } from "lucide-react";

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
      className="rounded-xl border-border/70 bg-background/90 shadow-sm md:hidden shrink-0"
      onClick={toggleSidebar}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  );
}

function DesktopSidebarTrigger() {
  const { toggleSidebar, isMobile, open } = useSidebar();

  if (isMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="-ml-1.5 h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted/50 hover:text-foreground hidden md:flex"
      onClick={toggleSidebar}
      title="Toggle Sidebar"
    >
      {
        open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />
      }
      <span className="sr-only">Toggle Sidebar</span>
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
        <div className="flex flex-col gap-2 sm:flex-1">
          <div className="flex flex-row items-start justify-between gap-4 sm:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              {mobileMenuTrigger ? <MobileMenuTrigger /> : null}
              {/* {backAction ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
                  onClick={backAction.onClick}
                >
                  {backAction.label}
                </Button>
              ) : null} */}
              <DesktopSidebarTrigger />
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
              <div className="flex shrink-0 flex-wrap items-center gap-2">
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
          <div className="flex flex-col gap-3 sm:ml-1">
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
