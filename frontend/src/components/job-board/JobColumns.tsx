import { Button, Badge, Label, Switch } from "@/components/";
import { cn } from "@/lib/utils";
import { DateDisplay } from "@/components/shared/DateDisplay";
import SkillsBadgeList from "@/components/shared/SkillsBadgeList";
import type { Job } from "@/types/job";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { Edit2, Users, ArrowUpDown, Trash2Icon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Row-level action callbacks consumed by {@link getJobColumns}.
 */
interface ColumnHandlers {
  onToggleStatus: (job: Job) => void;
  onDelete: (job: Job) => void;
  onEdit: (job: Job) => void;
  onCandidates: (job: Job) => void;
  onViewSessions: (job: Job) => void;
  loadingJobId?: string | null;
}

/**
 * Builds the column definitions for the job-board data table.
 *
 * Columns include title (with version badge and department), active-status
 * toggle, creation date, skills list, and action buttons for edit, delete,
 * and view candidates.
 *
 * @param handlers - Row-level action callbacks wired to the parent page.
 * @returns An array of TanStack Table column definitions for {@link Job}.
 */
export const getJobColumns = ({
  onToggleStatus,
  onDelete,
  onEdit,
  onCandidates,
  onViewSessions,
  loadingJobId,
}: ColumnHandlers): ColumnDef<Job>[] => [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 min-w-[200px] max-w-[300px]">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm text-wrap"
              // text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl
              title={row.original.title}
            >
              {row.original.title}

              {row.original.version && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs font-normal h-5 px-1.5 rounded-md shrink-0"
                >
                  v{row.original.version}
                </Badge>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm text-muted-foreground truncate"
              title={row.original.department?.name || "No Department"}
            >
              {row.original.department?.name || "No Department"}
            </span>
            <Badge
              variant="outline"
              className="text-xs font-normal h-5 px-1.5 rounded-md border-muted-foreground/20 shrink-0"
            >
              {row.original.vacancy != null ? (
                <span> <span className="font-bold">{row.original.vacancy}</span> Openings</span>
              ) : (
                <span>No Openings</span>
              )}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => {
        return (
          <PermissionGuard
            permissions={PERMISSIONS.JOBS_MANAGE}
            hideWhenDenied={true}
          >
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 font-semibold"
            >
              Job Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </PermissionGuard>
        );
      },
      cell: ({ row }) => (
        <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
          <div className="flex items-center justify-center gap-3 max-w-[100px] ">
            <Switch
              checked={row.original.is_active}
              onCheckedChange={() => onToggleStatus(row.original)}
              id={`status-${row.original.id}`}
              size="sm"
            />
            <Label
              htmlFor={`status-${row.original.id}`}
              className={cn(
                "text-sm font-medium transition-colors cursor-pointer",
                row.original.is_active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {row.original.is_active ? "Active" : "Inactive"}
            </Label>
          </div>
        </PermissionGuard>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <DateDisplay date={row.getValue("created_at")} showIcon />
      ),
    },
    {
      accessorKey: "activity_sessions",
      header: "Hiring Activity",
      cell: ({ row }) => {
        const sessions = row.original.activity_sessions || [];
        const displaySessions = sessions.slice(-3).reverse(); // Show last 3 sessions // use -3 and reverse() if reverse needed

        const remainingCount = sessions.length - 3;
        const totalCandidates = row.original.total_candidates || 0;

        return (
          <div className="flex flex-col gap-0.5 min-w-[140px]">
            {sessions.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">
                No sessions
              </span>
            ) : (
              <>
                {displaySessions.map((s) => (
                  <div key={s.session_id} className="flex items-center text-xs">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {displaySessions.length > 1 && (
                        <Badge
                          variant="outline"
                          className="h-5 px-1 py-0 text-[10px] leading-none border-primary/20 bg-primary/5"
                        >
                          #{s.session_id}
                        </Badge>
                      )}
                      <span className="truncate mr-0.5">
                        <DateDisplay date={s.start_date} />
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-sm font-normal h-5 px-1.5 rounded-md border-muted-foreground/20"
                    >
                      <span className="font-bold">  {s.candidate_count}</span> cand.
                    </Badge>
                  </div>
                ))}
                {remainingCount > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary font-semibold hover:no-underline flex justify-start w-fit group"
                    onClick={() => onViewSessions(row.original)}
                  >
                    + {remainingCount} more
                    <span className="ml-1 opacity-100 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </Button>
                )}
                {sessions.length <= 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 hover:text-primary transition-colors font-medium hover:no-underline flex justify-start w-fit"
                    onClick={() => onViewSessions(row.original)}
                  >
                    View details
                  </Button>
                )}
              </>
            )}

            <div className="flex items-center gap-1.5 pt-0.5 border-t border-border/40">
              <span className="text-[13px] font-semibold text-muted-foreground">
                Total candidates:{" "}
                <span className="font-bold text-foreground">
                  {totalCandidates}
                </span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => (
        <div className="max-w-[150px]">
          <SkillsBadgeList skills={row.original.skills} maxVisible={2} />
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
            <HoverCard>
              <HoverCardTrigger
                render={(props) => (
                  <Button
                    {...props}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={() => onEdit(row.original)}
                    isLoading={loadingJobId === row.original.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              />
              <HoverCardContent side="top" className="w-auto p-2 min-w-0">
                <div className="text-sm font-semibold text-primary">

                  Edit Job
                </div>
              </HoverCardContent>
            </HoverCard>
          </PermissionGuard>
          <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
            <HoverCard>
              <HoverCardTrigger
                render={(props) => (
                  <Button
                    {...props}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                    onClick={() => onDelete(row.original)}
                    disabled={!!row.original.is_active}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                )}
              />
              <HoverCardContent side="top" className="w-auto p-2 min-w-0">
                <div className="text-sm font-semibold text-destructive">
                  Delete Job
                </div>
              </HoverCardContent>
            </HoverCard>
          </PermissionGuard>
          <PermissionGuard
            permissions={PERMISSIONS.CANDIDATES_ACCESS}
            hideWhenDenied
          >
            <HoverCard>
              <HoverCardTrigger
                render={(props) => (
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                    onClick={() => onCandidates(row.original)}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
              />
              <HoverCardContent side="top" className="w-auto p-2 min-w-0">
                <div className="text-sm font-semibold text-blue-500">
                  View Candidates
                </div>
              </HoverCardContent>
            </HoverCard>
          </PermissionGuard>
        </div>
      ),
    },
  ];
