import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface CandidateTableFiltersProps {
  nameFilter: string;
  setNameFilter: (value: string) => void;
  statusFilter: string[];
  setStatusFilter: (value: string[]) => void;
  locationFilter: string[];
  setLocationFilter: (value: string[]) => void;
  jobFilter: string[];
  setJobFilter: (value: string[]) => void;
  showJobContext?: boolean;
  showLocationFilter?: boolean;
  showStatusFilter?: boolean;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  hrDecisionFilter: string[];
  setHrDecisionFilter: (value: string[]) => void;
  resumeScreeningFilter: string[];
  setResumeScreeningFilter: (value: string[]) => void;
  statusOptions: string[];
  locationOptions: string[];
  locationSearch: string;
  setLocationSearch: (value: string) => void;
  jobOptions: { id: string; title: string; slug: string }[];
  jobSearch: string;
  setJobSearch: (value: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  resultCount: number;
  totalCount: number;
  minDate: Date;
  availableJobs: {
    id: string;
    title: string;
    slug: string;
  }[]
}

export const CandidateTableFilters = ({
  nameFilter,
  setNameFilter,
  locationFilter,
  setLocationFilter,
  jobFilter,
  setJobFilter,
  showJobContext = false,
  dateRange,
  setDateRange,
  hrDecisionFilter,
  setHrDecisionFilter,
  resumeScreeningFilter,
  setResumeScreeningFilter,
  locationOptions,
  locationSearch,
  setLocationSearch,
  jobOptions,
  jobSearch,
  setJobSearch,
  hasActiveFilters,
  clearFilters,
  resultCount,
  totalCount,
  minDate,
  availableJobs,
  showLocationFilter = true,

}: CandidateTableFiltersProps) => {


  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-muted-foreground/10 text-center">
      {/* Column 1: Search field (Anchored Left) */}
      <div className="relative w-full lg:w-[320px]">
        <Input
          placeholder="Search name or email…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="pl-9 h-9 rounded-xl text-sm w-full"
        />
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Column 2: Filtration options loop (Middle) */}
      <div className="grid grid-cols-2 lg:flex lg:flex-wrap lg:items-center gap-2 min-w-0">
        {/* Job dropdown */}
        {showJobContext && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center justify-between gap-2 h-9 px-3 w-full lg:w-[160px] rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
                jobFilter.length > 0
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="truncate mr-auto">
                {jobFilter.length === 0
                  ? "All Jobs"
                  : jobFilter.length === 1
                    ? availableJobs.find((j) => j.id === jobFilter[0])?.title || "1 Job"
                    : `${jobFilter.length} Jobs`}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px] p-2">
              <div className="px-1 pb-2">
                <div className="relative">
                  <Input
                    placeholder="Search jobs..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="h-9 rounded-xl text-xs pl-2"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                <DropdownMenuGroup>
                  {jobOptions.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-center text-muted-foreground">
                      not found "{jobSearch}"
                    </div>
                  ) : (
                    jobOptions.map((j) => (
                      <DropdownMenuCheckboxItem
                        key={j.id}
                        checked={jobFilter.includes(j.id)}
                        onSelect={(e) => e.preventDefault()}
                        onClick={() =>
                          setJobFilter(
                            jobFilter.includes(j.id)
                              ? jobFilter.filter((v) => v !== j.id)
                              : [...jobFilter, j.id]
                          )
                        }
                        closeOnClick={true}
                      >
                        {j.title}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuGroup>
              </div>
              {jobFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onClick={() => setJobFilter([])}
                    closeOnClick={true}
                  >
                    Clear jobs
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Location dropdown */}
        {showLocationFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center justify-between gap-2 h-9 px-3 w-full lg:w-[150px] rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
                locationFilter.length > 0
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="truncate mr-auto">
                {locationFilter.length === 0
                  ? "All Locations"
                  : locationFilter.length === 1
                    ? locationFilter[0]
                    : `${locationFilter.length} locations`}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px] p-2">
              <div className="px-1 pb-2">
                <div className="relative">
                  <Input
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="h-9 rounded-xl text-xs pl-2"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                <DropdownMenuGroup>
                  {locationOptions.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-center text-muted-foreground">
                      not found "{locationSearch}"
                    </div>
                  ) : (
                    locationOptions.map((l) => (
                      <DropdownMenuCheckboxItem
                        key={l}
                        checked={locationFilter.includes(l)}
                        onSelect={(e) => e.preventDefault()}
                        onClick={() =>
                          setLocationFilter(
                            locationFilter.includes(l)
                              ? locationFilter.filter((v) => v !== l)
                              : [...locationFilter, l]
                          )
                        }
                        closeOnClick={true}
                      >
                        {l}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuGroup>
              </div>
              {locationFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onClick={() => setLocationFilter([])}
                    closeOnClick={true}
                  >
                    Clear locations
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* HR Decision multi-select dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex items-center justify-between gap-2 h-9 px-3 w-full lg:w-[140px] rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
              hrDecisionFilter.length > 0
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="truncate mr-auto">
              {hrDecisionFilter.length === 0
                ? "All Decisions"
                : hrDecisionFilter.length === 1
                  ? [{ v: "approve", l: "Approved" }, { v: "may be", l: "May be" }, { v: "reject", l: "Rejected" }, { v: "pending", l: "Pending" }].find((d) => d.v === hrDecisionFilter[0])?.l
                  : `${hrDecisionFilter.length} selected`}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>HR Decision</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { value: "approve", label: "Approved" },
                { value: "may be", label: "May be" },
                { value: "reject", label: "Rejected" },
                { value: "pending", label: "Pending" },
              ].map((d) => (
                <DropdownMenuCheckboxItem
                  key={d.value}
                  checked={hrDecisionFilter.includes(d.value)}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() =>
                    setHrDecisionFilter(
                      hrDecisionFilter.includes(d.value)
                        ? hrDecisionFilter.filter((v) => v !== d.value)
                        : [...hrDecisionFilter, d.value]
                    )
                  }
                  closeOnClick={true}
                >
                  {d.label}
                </DropdownMenuCheckboxItem>
              ))}
              {hrDecisionFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onClick={() => setHrDecisionFilter([])}
                  >
                    Clear selection
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* resume screening result dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex items-center justify-between gap-2 h-9 px-3 w-full lg:w-[160px] rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
              resumeScreeningFilter.length > 0
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="truncate mr-auto">
              {resumeScreeningFilter.length === 0
                ? "Resume Screening"
                : resumeScreeningFilter.length === 1
                  ? [{ v: "pass", l: "Pass" }, { v: "fail", l: "Fail" }].find((d) => d.v === resumeScreeningFilter[0])?.l
                  : `${resumeScreeningFilter.length} selected`}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Resume Screening</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { value: "pass", label: "Pass" },
                { value: "fail", label: "Fail" },
              ].map((d) => (
                <DropdownMenuCheckboxItem
                  key={d.value}
                  checked={resumeScreeningFilter.includes(d.value)}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() =>
                    setResumeScreeningFilter(
                      resumeScreeningFilter.includes(d.value)
                        ? resumeScreeningFilter.filter((v) => v !== d.value)
                        : [...resumeScreeningFilter, d.value]
                    )
                  }
                  closeOnClick={true}
                >
                  {d.label}
                </DropdownMenuCheckboxItem>
              ))}
              {resumeScreeningFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onClick={() => setResumeScreeningFilter([])}
                  >
                    Clear selection
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date range picker */}
        <div className="flex items-center gap-1.5 px-3 h-9 w-full lg:w-[240px] rounded-xl border border-input text-sm bg-background">
          <Popover>
            <PopoverTrigger
              className={cn(
                "inline-flex items-center justify-between w-full h-7 text-xs font-normal rounded-md bg-transparent hover:bg-transparent focus-visible:outline-none",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <div className="flex items-center truncate">
                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Applied date range"
                  )}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-2xl border bg-popover shadow-2xl ml-2 ring-1 ring-foreground/5 overflow-hidden"
              align="start"
            >
              <Calendar
                autoFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                disabled={{ after: new Date(), before: minDate }}
                buttonVariant="ghost"
                captionLayout="label"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Column 2 - Clear Logic (Inside the filters area) */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Column 3: Result count area (Anchored Right) */}
      <div className="text-xs font-medium flex items-center gap-2 justify-self-center">
        Total <span className="font-bold">{totalCount}</span> Candidates
        <Separator orientation="vertical" className="h-4 bg-gray-700 dark:bg-gray-300" />
        <span className="font-bold">{resultCount}</span> Candidates found
      </div>
    </div>
  );
};
