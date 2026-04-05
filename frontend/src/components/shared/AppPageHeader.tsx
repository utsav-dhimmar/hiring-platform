import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";

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
  className?: string;
  contentClassName?: string;
  headingClassName?: string;
}

export default function AppPageHeader({
  title,
  subtitle,
  breadcrumbs = <DashboardBreadcrumbs />,
  meta,
  actions,
  className,
  contentClassName,
  headingClassName,
}: AppPageHeaderProps) {
  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full",
          "bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
          "border-b border-border/50 shadow-xs",
          className
        )}
      >
        <div className={cn("px-4 py-4 flex flex-col gap-4", contentClassName)}>
          {/* Navbar Layer: Title and Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex flex-col min-w-0 overflow-hidden">
                <h1
                  className={cn(
                    "text-lg font-bold tracking-tight text-foreground sm:text-xl truncate",
                    headingClassName
                  )}
                >
                  {title}
                </h1>
              </div>
            </div>

            {actions && (
              <div className="flex shrink-0 items-center gap-2">
                {actions}
              </div>
            )}
          </div>

          {/* Supplementary Layer: Subtitle and Meta */}
          {(subtitle || meta) && (
            <div className="flex flex-col gap-3">
              {subtitle && (
                <p className="max-w-3xl text-sm text-muted-foreground leading-relaxed">
                  {subtitle}
                </p>
              )}
              {meta && (
                <div className="flex flex-wrap items-center gap-3">
                  {meta}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumbs Label Row */}
      {breadcrumbs && (
        <div className="px-2 py-1.5 border-b border-border/40 bg-muted/5 mb-1">
          <div className="hidden sm:block overflow-hidden">
            {breadcrumbs}
          </div>
        </div>
      )}
    </>
  );
}
