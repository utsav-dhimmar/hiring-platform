import { Button, Badge, Label, Switch } from "@/components/";
import { cn } from "@/lib/utils";
import { DateDisplay, SkillsBadgeList } from "@/components/shared";
import type { Job } from "@/types/job";
import { Edit2, Users, ArrowUpDown, Trash2Icon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

/**
 * Row-level action callbacks consumed by {@link getJobColumns}.
 */
interface ColumnHandlers {
  /** Toggles the job's active/inactive status. */
  onToggleStatus: (job: Job) => void;
  /** Initiates deletion for the job. */
  onDelete: (job: Job) => void;
  /** Navigates to the job's edit page. */
  onEdit: (job: Job) => void;
  /** Navigates to the job's candidates page. */
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
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
          title="Edit Job"
          onClick={() => onEdit(row.original)}
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only" title="edit">
            Edit Job
          </span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
          title="Delete Job"
          onClick={() => onDelete(row.original)}
        >
          <Trash2Icon className="h-4 w-4" />
          <span className="sr-only" title="delete">
            Delete Job
          </span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all"
          title="View Candidates"
          onClick={() => onCandidates(row.original)}
        >
          <Users className="h-4 w-4" />
          <span className="sr-only" title="view">
            View Candidates
          </span>
        </Button>
      </div>
    ),
  },
];
