import type { ReactNode } from "react";
import {
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
  breadcrumbs,
  meta,
  actions,
  className,
  contentClassName,
  headingClassName,
}: AppPageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full mb-6",
        "bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
        "border-b border-border/50 shadow-xs",
        className
      )}
    >
      <div className={cn("px-4 py-4 flex flex-col gap-4", contentClassName)}>
        {/* Navbar Layer: Toggle, Breadcrumbs/Title, and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />

            <div className="flex flex-col min-w-0 overflow-hidden">

              <h1
                className={cn(
                  "text-lg font-bold tracking-tight text-foreground sm:text-xl truncate",
                  headingClassName
                )}
              >
                {title}
              </h1>
              {breadcrumbs && (
                <div className="hidden sm:block overflow-hidden mb-0.5">
                  {breadcrumbs}
                </div>
              )}
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
  );
}
