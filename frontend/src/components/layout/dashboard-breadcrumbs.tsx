import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";
import {
  Home,
  Briefcase,
  Users,
  PlusCircle,
  Settings,
  ShieldCheck,
  FileText,
  BarChart3,
  UserCog,
  ScrollText,
  Upload,
  Sparkles,
  GitBranch,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

/**
 * Predefined route metadata: maps a URL segment to a friendly label and icon.
 * Segments NOT present here are treated as dynamic (slugs / IDs) and formatted
 * by capitalizing + replacing dashes with spaces.
 */
const ROUTE_META: Record<string, { label: string; icon?: LucideIcon }> = {
  dashboard: { label: "Home", icon: Home },
  jobs: { label: "Jobs", icon: Briefcase },
  candidates: { label: "Candidates", icon: Users },
  new: { label: "Create Job", icon: PlusCircle },
  edit: { label: "Edit Job", icon: Settings },
  versions: { label: "Versions", icon: GitBranch },
  admin: { label: "Admin", icon: ShieldCheck },
  users: { label: "Users", icon: UserCog },
  roles: { label: "Roles", icon: ShieldCheck },
  skills: { label: "Skills", icon: Sparkles },
  "audit-logs": { label: "Audit Logs", icon: ScrollText },
  "recent-uploads": { label: "Recent Uploads", icon: Upload },
  stats: { label: "Statistics", icon: BarChart3 },
  profile: { label: "Profile", icon: UserCog },
};

const HIDE_DYNAMIC_BEFORE = new Set(["edit", "candidates", "versions"]);
const DYNAMIC_PARENT_SEGMENTS = new Set(["jobs"]);

function shouldHideSegment(pathnames: string[], index: number) {
  const segment = pathnames[index];
  const nextSegment = pathnames[index + 1];
  const previousSegment = pathnames[index - 1];

  if (ROUTE_META[segment]) {
    return false;
  }

  if (!previousSegment || !DYNAMIC_PARENT_SEGMENTS.has(previousSegment)) {
    return false;
  }

  return !nextSegment || HIDE_DYNAMIC_BEFORE.has(nextSegment);
}

export function DashboardBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  const visibleSegments = pathnames
    .map((segment, index) => ({ segment, index }))
    .filter(({ index }) => !shouldHideSegment(pathnames, index));

  const crumbs = visibleSegments.map(({ segment, index }, crumbIndex) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
    const meta = ROUTE_META[segment];
    const label = meta?.label ?? "Details";
    const Icon = meta?.icon ?? FileText;
    const isLast = crumbIndex === visibleSegments.length - 1;

    return { routeTo, label, Icon, isLast, crumbIndex };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap overflow-hidden text-[11px] text-muted-foreground sm:text-xs">
        {crumbs.map(({ routeTo, label, Icon, isLast, crumbIndex }) => (
          <React.Fragment key={routeTo}>
            <BreadcrumbItem
              className={
                crumbIndex === 0
                  ? "hidden md:flex min-w-0 items-center gap-1.5"
                  : "flex min-w-0 items-center gap-1.5"
              }
            >
              {isLast ? (
                <BreadcrumbPage className="flex min-w-0 items-center gap-1.5 font-semibold text-primary">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-30 sm:max-w-45 lg:max-w-60">
                    {label}
                  </span>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={<Link to={routeTo} />}
                  className="flex min-w-0 items-center gap-1.5 text-muted-foreground/70 transition-colors duration-200 hover:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-18 sm:max-w-35 lg:max-w-45">
                    {label}
                  </span>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {!isLast && (
              <BreadcrumbSeparator
                className={
                  crumbIndex === 0
                    ? "hidden md:flex [&>svg]:size-3"
                    : "[&>svg]:size-3"
                }
              >
                <ChevronRight className="text-muted-foreground/40" />
              </BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
