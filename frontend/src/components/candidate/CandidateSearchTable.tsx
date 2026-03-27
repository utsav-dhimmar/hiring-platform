import { type ReactElement } from "react";
import { DataTable, StatusBadge, DateDisplay } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUpDown } from "lucide-react";
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
  // onShowScreeningDetails,
  // onDelete,
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
          <div className="flex flex-col gap-1.5 items-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{score.toFixed(1)}%</span>
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            <StatusBadge
              status={
                row.original.pass_fail === null ? "pending" : row.original.pass_fail ? "pass" : "fail"
              }
              className="rounded-full px-2 py-0 text-[10px] uppercase font-bold w-fit tracking-wider"
              mapping={{
                pass: "default",
                fail: "destructive",
                pending: "secondary",
              }}
            />
          </div>
        );
      },
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
          <div className="flex items-center gap-2 justify-end pr-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl font-semibold h-9 px-4 bg-muted/50 hover:bg-muted text-foreground transition-all border border-muted-foreground/10"
              title="View Details"
              onClick={() => onShowMore(c)}
            >
              More Info
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
