import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, X, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
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

interface CandidateTableFiltersProps {
  nameFilter: string;
  setNameFilter: (value: string) => void;
  statusFilter: string[];
  setStatusFilter: (value: string[]) => void;
  locationFilter: string[];
  setLocationFilter: (value: string[]) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  hrDecisionFilter: string[];
  setHrDecisionFilter: (value: string[]) => void;
  statusOptions: string[];
  locationOptions: string[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  resultCount: number;
  totalCount: number;
  minDate: Date;
}

export const CandidateTableFilters = ({
  nameFilter,
  setNameFilter,
  // statusFilter,
  // setStatusFilter,
  locationFilter,
  setLocationFilter,
  dateRange,
  setDateRange,
  hrDecisionFilter,
  setHrDecisionFilter,
  // statusOptions,
  locationOptions,
  hasActiveFilters,
  clearFilters,
  resultCount,
  totalCount,
  minDate
}: CandidateTableFiltersProps) => {

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-2xl border border-muted-foreground/10 ">
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
      {/* <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
            statusFilter.length > 0
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {statusFilter.length === 0
            ? "All Statuses"
            : statusFilter.length === 1
              ? capitalize(statusFilter[0])
              : `${statusFilter.length} statuses`}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={statusFilter.includes(s)}
                onSelect={(e) => e.preventDefault()}
                onClick={() =>
                  setStatusFilter(
                    statusFilter.includes(s)
                      ? statusFilter.filter((v) => v !== s)
                      : [...statusFilter, s]
                  )
                }
              >
                {capitalize(s)}
              </DropdownMenuCheckboxItem>
            ))}
            {statusFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onClick={() => setStatusFilter([])}
                >
                  Clear statuses
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu> */}

      {/* Location dropdown */}
      {locationOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
              locationFilter.length > 0
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {locationFilter.length === 0
              ? "All Locations"
              : locationFilter.length === 1
                ? locationFilter[0]
                : `${locationFilter.length} locations`}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Location</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {locationOptions.map((l) => (
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
                >
                  {l}
                </DropdownMenuCheckboxItem>
              ))}
              {locationFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onClick={() => setLocationFilter([])}
                  >
                    Clear locations
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* HR Decision multi-select dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
            hrDecisionFilter.length > 0
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {hrDecisionFilter.length === 0
            ? "All Decisions"
            : hrDecisionFilter.length === 1
              ? [{ v: "approve", l: "Approved" }, { v: "may be", l: "May be" }, { v: "reject", l: "Rejected" }, { v: "pending", l: "Pending" }].find((d) => d.v === hrDecisionFilter[0])?.l
              : `${hrDecisionFilter.length} selected`}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
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

      {/* Date range picker */}
      <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-input text-sm">
        <Popover>
          <PopoverTrigger
            className={cn(
              "inline-flex items-center h-7 px-2 text-xs font-normal rounded-md bg-transparent hover:bg-transparent focus-visible:outline-none",
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
        {resultCount} / {totalCount} applicants found
      </span>
    </div>
  );
};
