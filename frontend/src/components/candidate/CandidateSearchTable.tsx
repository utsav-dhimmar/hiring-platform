import { type ReactElement } from "react";
import { DataTable, StatusBadge, DateDisplay } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Trash2, FileText, ArrowUpDown } from "lucide-react";
import type { CandidateResponse } from "@/types/resume";
import type { ColumnDef, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { GithubLogo, LinkedinLogo } from "@/components/logo";
import { Button } from "../ui/button";

interface CandidateSearchTableProps {
  candidates: CandidateResponse[];
  total: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onShowMore: (candidate: CandidateResponse) => void;
  onShowScreeningDetails: (candidate: CandidateResponse) => void;
  onDelete: (candidate: CandidateResponse) => void;
}

const CandidateSearchTable = ({
  candidates,
  total,
  pagination,
  onPaginationChange,
  onShowMore,
  onShowScreeningDetails,
  onDelete,
}: CandidateSearchTableProps): ReactElement => {
  const columns: ColumnDef<CandidateResponse>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Candidate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-bold">
              {c.is_parsed ? (
                `${c.first_name || ""} ${c.last_name || ""}`.trim() || "N/A"
              ) : (
                <span className="text-muted-foreground italic">Processing...</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">{c.email || "No email"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "resume_score",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const score = row.original.resume_score;
        if (score === null) return <span className="text-muted-foreground text-sm">N/A</span>;
        return (
          <Badge
            variant={score >= 75 ? "default" : score >= 50 ? "secondary" : "destructive"}
            className="px-2 py-0.5 rounded-lg font-medium"
          >
            {score.toFixed(1)}%
          </Badge>
        );
      },
    },
    {
      accessorKey: "pass_fail",
      header: "Result",
      cell: ({ row }) => (
        <StatusBadge
          status={
            row.original.pass_fail === null ? "pending" : row.original.pass_fail ? "pass" : "fail"
          }
          mapping={{
            pass: "default",
            fail: "destructive",
            pending: "secondary",
          }}
        />
      ),
    },
    {
      accessorKey: "processing_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.processing_status;
        if (status === "processing" || status === "queued") {
          return (
            <Badge variant="secondary" className="inline-flex items-center gap-1 rounded-lg">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </Badge>
          );
        }
        return <StatusBadge status={status === "failed" ? "failed" : "completed"} />;
      },
    },
    {
      id: "socials",
      header: "Socials",
      cell: ({ row }) => {
        const { linkedin_url, github_url } = row.original;
        return (
          <div className="flex gap-2">
            {linkedin_url ? (
              <a
                href={linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="LinkedIn Profile"
              >
                <LinkedinLogo className="h-4 w-4" />
              </a>
            ) : (
              <LinkedinLogo className="h-4 w-4 text-muted-foreground/30" />
            )}
            {github_url ? (
              <a
                href={github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-black transition-colors"
                title="GitHub Profile"
              >
                <GithubLogo className="h-4 w-4" />
              </a>
            ) : (
              <GithubLogo className="h-4 w-4 text-muted-foreground/30" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Applied
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <DateDisplay date={row.original.created_at} showTime={false} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary border-muted"
              title="View Details"
              onClick={() => onShowMore(c)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 border-muted"
              title="Screening Details"
              onClick={() => onShowScreeningDetails(c)}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive border-muted"
              title="Delete Candidate"
              onClick={() => onDelete(c)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={candidates}
        isServerSide={true}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        pageCount={Math.ceil(total / pagination.pageSize)}
        onPaginationChange={onPaginationChange}
        searchKey="name"
        searchPlaceholder="Filter by name..."
      />
    </div>
  );
};

export default CandidateSearchTable;
