import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { DateDisplay, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { GithubLogo, LinkedinLogo } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { UnifiedCandidate } from "@/types/candidate";

function scoreColor(score: number, threshold: number = 65) {
  if (score >= 80) return "bg-green-500";
  if (score >= threshold) return "bg-yellow-500";
  return "bg-red-500";
}

interface UseCandidateTableColumnsProps<T extends UnifiedCandidate> {
  renderActions?: (candidate: T) => React.ReactNode;
  passing_threshold?: number;
}

export const useCandidateTableColumns = <T extends UnifiedCandidate>({
  renderActions,
  passing_threshold = 65,
}: UseCandidateTableColumnsProps<T>) => {
  return useMemo<ColumnDef<T>[]>(
    () => [
      // 1. CANDIDATE
      {
        id: "candidate",
        accessorFn: (row) =>
          `${row.first_name || ""} ${row.last_name || ""}`.trim(),
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
          const isProcessing =
            c.processing_status === "processing" || !c.is_parsed;
          const fullName =
            `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
            "Unknown Candidate";
          return (
            <div className="flex flex-col gap-0.5 min-w-[160px]">
              <span className="font-bold text-base text-foreground">
                {isProcessing && !c.first_name ? (
                  <span className="text-muted-foreground italic text-sm">
                    Processing…
                  </span>
                ) : (
                  fullName
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {c.email || "N/A"}
              </span>
              <span className="text-xs text-muted-foreground">
                {c.phone || "N/A"}
              </span>
            </div>
          );
        },
      },

      // 2. SCORE
      {
        id: "score",
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
          const c = row.original;
          const isProcessing =
            c.processing_status === "processing" || !c.is_parsed;

          if (isProcessing) {
            return (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium text-muted-foreground italic">
                    Analyzing…
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0 text-[10px] uppercase font-bold w-fit tracking-wider bg-blue-500/5 text-blue-500 border-blue-200/50 animate-pulse"
                >
                  Processing
                </Badge>
              </div>
            );
          }

          const score = c.resume_score ?? null;
          if (score === null) {
            return <span className="text-muted-foreground text-sm">N/A</span>;
          }

          return (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{score.toFixed(1)}%</span>
                <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${scoreColor(score, passing_threshold)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
              <StatusBadge
                status={
                  c.pass_fail === null || c.pass_fail === undefined
                    ? "pending"
                    :
                    (c.pass_fail === true ||
                      String(c.pass_fail).toLowerCase() === "pass" || 
                      (c.resume_score ?? 0) >= passing_threshold)
                      ? "pass"
                      : "fail"
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

      // 3. STATUS
      {
        id: "status",
        accessorKey: "processing_status",
        header: "Status",
        cell: ({ row }) => {
          const c = row.original;
          const status = c.processing_status || c.current_status;
          if (status === "processing" || status === "queued") {
            return (
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-1 rounded-lg"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing
              </Badge>
            );
          }
          if (!status)
            return <span className="text-muted-foreground text-sm">N/A</span>;
          return (
            <StatusBadge
              status={status === "failed" ? "failed" : "completed"}
            />
          );
        },
      },

      // 4. SCREENING DECISION
      {
        id: "hr_decision",
        accessorKey: "hr_decision",
        header: "HR Decision",
        cell: ({ row }) => {
          const decision = row.original.hr_decision;
          if (!decision) {
            return (
              <span className="text-muted-foreground text-sm">Pending</span>
            );
          }

          return (
            <StatusBadge
              status={decision}
              label={
                decision === "approve"
                  ? "approved"
                  : decision === "reject"
                    ? "rejected"
                    : decision
              }
              className="rounded-full px-2 py-0 text-[10px] uppercase font-bold w-fit tracking-wider"
              mapping={{
                approve: "default",
                reject: "destructive",
                maybe: "secondary",
              }}
            />
          );
        },
      },

      // 5. SOCIALS
      {
        id: "socials",
        header: "Socials",
        cell: ({ row }) => {
          const { linkedin_url, github_url } = row.original;
          return (
            <div className="flex items-center gap-1">
              {linkedin_url ? (
                <a
                  href={
                    linkedin_url.startsWith("http")
                      ? linkedin_url
                      : `https://${linkedin_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn Profile"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "text-blue-600 hover:text-blue-800 transition-colors",
                  )}
                >
                  <LinkedinLogo className="h-4 w-4" />
                </a>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled
                  className="px-0"
                >
                  <LinkedinLogo className="h-4 w-4" />
                </Button>
              )}

              {github_url ? (
                <a
                  href={
                    github_url.startsWith("http")
                      ? github_url
                      : `https://${github_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub Profile"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "text-gray-900 hover:text-black dark:text-gray-200 dark:hover:text-white transition-colors",
                  )}
                >
                  <GithubLogo className="h-4 w-4" />
                </a>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled
                  className="px-0"
                >
                  <GithubLogo className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },

      // 6. APPLIED AT
      {
        id: "applied_at",
        accessorFn: (row) => row.applied_at || row.created_at,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Applied At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.original.applied_at || row.original.created_at;
          if (!date)
            return <span className="text-muted-foreground text-sm">N/A</span>;
          return <DateDisplay date={date} showTime={false} />;
        },
      },

      // 7. LOCATION
      {
        id: "location",
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const loc = row.original.location;
          if (!loc)
            return <span className="text-muted-foreground text-sm">N/A</span>;
          const truncatedLoc = loc.length > 20 ? `${loc.slice(0, 18)}...` : loc;
          return (
            <div className="flex items-center gap-1.5 text-sm" title={loc}>
              <span>{truncatedLoc}</span>
            </div>
          );
        },
      },

      // 8. ACTIONS
      ...(renderActions
        ? [
          {
            id: "actions",
            header: () => <div className="text-right pr-2">Actions</div>,
            cell: ({ row }: { row: { original: T } }) => (
              <div className="flex items-center justify-end gap-2 pr-2">
                {renderActions(row.original)}
              </div>
            ),
          } as ColumnDef<T>,
        ]
        : []),
    ],
    [renderActions],
  );
};
