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

/** Turn a slug like "senior-frontend-developer" into "Senior Frontend Developer" */
function humanize(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  // Build crumb data
  const crumbs = pathnames.map((segment, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
    const meta = ROUTE_META[segment];
    const label = meta?.label ?? humanize(segment);
    const Icon = meta?.icon ?? FileText;
    const isLast = index === pathnames.length - 1;

    return { segment, routeTo, label, Icon, isLast, index };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap text-xs sm:text-sm">
        {crumbs.map(({ routeTo, label, Icon, isLast, index }) => (
          <React.Fragment key={routeTo}>
            <BreadcrumbItem
              className={
                index === 0
                  ? "hidden md:flex items-center gap-1.5"
                  : "flex items-center gap-1.5"
              }
            >
              {isLast ? (
                <BreadcrumbPage className="flex items-center gap-1.5 font-semibold text-primary">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {label}
                  </span>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={<Link to={routeTo} />}
                  className="flex items-center gap-1.5 text-muted-foreground/70 hover:text-foreground transition-colors duration-200"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[100px] sm:max-w-[160px]">
                    {label}
                  </span>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {!isLast && (
              <BreadcrumbSeparator
                className={
                  index === 0
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
