/**
 * Unified CandidateTable component.
 *
 * Renders a consistent candidate table across all pages in the hiring platform.
 * Columns: Candidate (name · email · phone), Score, Status, Socials, Applied At, Location, Actions.
 *
 * Front-end filters: name search, status dropdown, location dropdown, applied-at date range.
 * All optional fields (location, applied_at, phone) safely fall back to "N/A".
 */

import { useMemo, useState } from "react";
import type { ColumnDef, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { ArrowUpDown, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

import { DataTable } from "@/components/shared/DataTable";
import { DateDisplay, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GithubLogo, LinkedinLogo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


// ─── Canonical candidate shape ────────────────────────────────────────────────
// Both ResumeScreeningResult and CandidateResponse satisfy this interface.
export interface UnifiedCandidate {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  current_status?: string | null;
  resume_score?: number | null;
  pass_fail?: boolean | null;
  is_parsed?: boolean;
  processing_status?: string | null;
  screening_decision?: "approve" | "reject" | "maybe" | null;
  created_at: string;
  /** Explicit apply timestamp – falls back to created_at, then "N/A" */
  applied_at?: string | null;
  /** Location extracted from resume */
  location?: string | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface CandidateTableProps<T extends UnifiedCandidate> {
  candidates: T[];
  total?: number;
  /** Slot for extra action buttons rendered per row */
  renderActions?: (candidate: T) => React.ReactNode;
  /** Header-level extra controls (e.g. "Reanalyze All" button) */
  headerActions?: React.ReactNode;
  // Server-side pagination (optional)
  isServerSide?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  pageCount?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 65) return "bg-yellow-500";
  return "bg-red-500";
}


// ─── Component ────────────────────────────────────────────────────────────────
export function CandidateTable<T extends UnifiedCandidate>({
  candidates,
  total,
  renderActions,
  headerActions,
  isServerSide = false,
  pagination,
  onPaginationChange,
  pageCount,
}: CandidateTableProps<T>) {

  // ── Filter state ──────────────────────────────────────────────────────────
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [hrDecisionFilter, setHrDecisionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: undefined, to: undefined });

  // ── Derived filter options ────────────────────────────────────────────────
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      const s = c.processing_status || c.current_status;
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.location) set.add(c.location);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // ── Client-side filtered data ─────────────────────────────────────────────
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Name / email filter
      const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase().trim();
      const email = (c.email || "").toLowerCase();
      if (
        nameFilter &&
        !fullName.includes(nameFilter.toLowerCase()) &&
        !email.includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const candidateStatus = c.processing_status || c.current_status || "";
        if (candidateStatus !== statusFilter) return false;
      }

      // Location filter
      if (locationFilter !== "all" && (c.location || "") !== locationFilter) {
        return false;
      }

      // Date range filter
      const rawDate = c.applied_at || c.created_at;
      if (rawDate && (dateRange?.from || dateRange?.to)) {
        const d = new Date(rawDate);
        if (dateRange.from && d < startOfDay(dateRange.from)) return false;
        if (dateRange.to && d > endOfDay(dateRange.to)) return false;
      }

      // HR Decision filter
      if (hrDecisionFilter !== "all") {
        if (hrDecisionFilter === "pending") {
          if (c.screening_decision) return false;
        } else if (c.screening_decision !== hrDecisionFilter) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, nameFilter, statusFilter, locationFilter, hrDecisionFilter, dateRange]);

  const hasActiveFilters =
    nameFilter ||
    statusFilter !== "all" ||
    locationFilter !== "all" ||
    hrDecisionFilter !== "all" ||
    dateRange?.from ||
    dateRange?.to;

  const clearFilters = () => {
    setNameFilter("");
    setStatusFilter("all");
    setLocationFilter("all");
    setHrDecisionFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  // ── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef<T>[] = useMemo(
    () => [
      // ── 1. CANDIDATE (name · email · phone) ──────────────────────────────
      {
        id: "candidate",
        accessorFn: (row) => `${row.first_name || ""} ${row.last_name || ""}`.trim(),
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
          const isProcessing = c.processing_status === "processing" || !c.is_parsed;
          const fullName =
            `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Unknown Candidate";
          return (
            <div className="flex flex-col gap-0.5 min-w-[160px]">
              <span className="font-bold text-base text-foreground">
                {isProcessing && !c.first_name ? (
                  <span className="text-muted-foreground italic text-sm">Processing…</span>
                ) : (
                  fullName
                )}
              </span>
              <span className="text-xs text-muted-foreground">{c.email || "N/A"}</span>
              <span className="text-xs text-muted-foreground">{c.phone || "N/A"}</span>
            </div>
          );
        },
      },

      // ── 2. SCORE ─────────────────────────────────────────────────────────
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
          const isProcessing = c.processing_status === "processing" || !c.is_parsed;

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
                    className={`h-full rounded-full ${scoreColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
              <StatusBadge
                status={
                  c.pass_fail === null || c.pass_fail === undefined
                    ? "pending"
                    : c.pass_fail && (c.resume_score ?? 0) >= 65
                      ? "pass"
                      : "fail"
                }
                className="rounded-full px-2 py-0 text-[10px] uppercase font-bold w-fit tracking-wider"
                mapping={{ pass: "default", fail: "destructive", pending: "secondary" }}
              />
            </div>
          );
        },
      },

      // ── 3. STATUS ────────────────────────────────────────────────────────
      {
        id: "status",
        accessorKey: "processing_status",
        header: "Status",
        cell: ({ row }) => {
          const c = row.original;
          const status = c.processing_status || c.current_status;
          if (status === "processing" || status === "queued") {
            return (
              <Badge variant="secondary" className="inline-flex items-center gap-1 rounded-lg">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing
              </Badge>
            );
          }
          if (!status) return <span className="text-muted-foreground text-sm">N/A</span>;
          return (
            <StatusBadge
              status={status === "failed" ? "failed" : "completed"}
            />
          );
        },
      },

      {
        id: "screening_decision",
        accessorKey: "screening_decision",
        header: ({ column }) => (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent font-semibold group"
              >
                <span>HR Decision</span>
                {/* {hrDecisionFilter !== "all" && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px] bg-primary/10 text-primary border-primary/20">
                    {hrDecisionFilter.charAt(0).toUpperCase() + hrDecisionFilter.slice(1)}
                  </Badge>
                )} */}
                <Filter className={cn(
                  "ml-2 h-3.5 w-3.5 transition-colors",
                  hrDecisionFilter !== "all" ? "text-primary fill-primary/10" : "text-muted-foreground group-hover:text-foreground"
                )} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter by Decision</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={hrDecisionFilter} onValueChange={setHrDecisionFilter}>
                  <DropdownMenuRadioItem value="all">All Decisions</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="approve">Approved</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="maybe">Maybe</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="reject">Rejected</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Sort</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                  Sort Ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                  Sort Descending
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        cell: ({ row }) => {
          const decision = row.original.screening_decision;
          if (!decision) {
            return <span className="text-muted-foreground text-sm">Pending</span>;
          }

          return (
            <StatusBadge
              status={decision}
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

      // ── 4. SOCIALS ───────────────────────────────────────────────────────
      {
        id: "socials",
        header: "Socials",
        cell: ({ row }) => {
          const { linkedin_url, github_url } = row.original;
          return (
            <div className="flex items-center gap-1">
              {linkedin_url ? (
                <a
                  href={linkedin_url.startsWith("http") ? linkedin_url : `https://${linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn Profile"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "text-blue-600 hover:text-blue-800 transition-colors"
                  )}
                >
                  <LinkedinLogo className="h-4 w-4" />
                </a>
              ) : (
                <Button variant="ghost" size="icon-sm" disabled className="px-0">
                  <LinkedinLogo className="h-4 w-4" />
                </Button>
              )}

              {github_url ? (
                <a
                  href={github_url.startsWith("http") ? github_url : `https://${github_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub Profile"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "text-gray-900 hover:text-black dark:text-gray-200 dark:hover:text-white transition-colors"
                  )}
                >
                  <GithubLogo className="h-4 w-4" />
                </a>
              ) : (
                <Button variant="ghost" size="icon-sm" disabled className="px-0">
                  <GithubLogo className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },

      // ── 5. APPLIED AT ────────────────────────────────────────────────────
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
          if (!date) return <span className="text-muted-foreground text-sm">N/A</span>;
          return <DateDisplay date={date} showTime={false} />;
        },
      },

      // ── 6. LOCATION ──────────────────────────────────────────────────────
      {
        id: "location",
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const loc = row.original.location;
          if (!loc) return <span className="text-muted-foreground text-sm">N/A</span>;
          const truncatedLoc = loc.length > 20 ? `${loc.slice(0, 18)}...` : loc;
          return (
            <div className="flex items-center gap-1.5 text-sm" title={loc}>
              <span>{truncatedLoc}</span>
            </div>
          );
        },
      },

      // ── 7. ACTIONS ───────────────────────────────────────────────────────
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

  return (
    <div className="w-full space-y-3">
      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-2xl border border-muted-foreground/10">
        {/* Name / email search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Input
            placeholder="Search name or email…"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="pl-9 h-9 rounded-xl text-sm"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        {/* Location dropdown */}
        {locationOptions.length > 0 && (
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer w-30"
          >
            <option value="all">All Locations</option>
            {locationOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}

        {/* Date range picker */}
        <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-input  text-sm">
          <Popover>
            <PopoverTrigger>
              <Button
                variant="ghost"
                className={cn(
                  "h-7 px-2 text-xs font-normal hover:bg-transparent",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Applied date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border bg-popover shadow-2xl ml-2 ring-1 ring-foreground/5 overflow-hidden" align="start">
              <Calendar
                autoFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}

        {/* Result count */}
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {filteredCandidates.length}
          {total != null && total !== candidates.length ? ` / ${total}` : ` / ${candidates.length}`}{" "}
          candidates
        </span>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={filteredCandidates}
        headerActions={headerActions}
        isServerSide={isServerSide}
        pageIndex={pagination?.pageIndex}
        pageSize={pagination?.pageSize}
        pageCount={pageCount}
        onPaginationChange={onPaginationChange}
      />
    </div>
  );
}

export default CandidateTable;
