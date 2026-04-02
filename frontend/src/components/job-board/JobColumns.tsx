import { Button, Badge, Label, Switch } from "@/components/";
import { cn } from "@/lib/utils";
import { DateDisplay, SkillsBadgeList } from "@/components/shared";
import type { Job } from "@/types/job";
import { Edit2, Users, ArrowUpDown, Trash2Icon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

/**
 * Row-level action callbacks consumed by {@link getJobColumns}.
 */
interface ColumnHandlers {
  onToggleStatus: (job: Job) => void;
  onDelete: (job: Job) => void;
  onEdit: (job: Job) => void;
  onCandidates: (job: Job) => void;
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
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{row.getValue("title")}</span>
            {row.original.version && (
              <Badge variant="secondary" className="text-xs font-normal h-5 px-1.5 rounded-md">
                v{row.original.version}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{row.original.department?.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
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
      cell: ({ row }) => <DateDisplay date={row.getValue("created_at")} showIcon />,
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <SkillsBadgeList skills={row.original.skills} maxVisible={2} />
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <HoverCard>
            <HoverCardTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                  onClick={() => onEdit(row.original)}
                  title="Edit Job"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            />
            <HoverCardContent side="top" className="w-auto p-2 min-w-0">
              <div className="text-sm font-semibold text-primary"> Edit Job</div>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                  onClick={() => onDelete(row.original)}
                  title="Delete Job"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              )}
            />
            <HoverCardContent side="top" className="w-auto p-2 min-w-0">
              <div className="text-sm font-semibold text-destructive"> Delete Job</div>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all"

                  onClick={() => onCandidates(row.original)}
                  title="View Candidates"
                >
                  <Users className="h-4 w-4" />
                </Button>
              )}
            />
            <HoverCardContent side="top" className="w-auto p-2 min-w-0">
              <div className="text-sm font-semibold text-blue-500"> View Candidates</div>
            </HoverCardContent>
          </HoverCard>
        </div>
      ),
    },
  ];
