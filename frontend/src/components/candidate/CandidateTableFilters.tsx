import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

interface CandidateTableFiltersProps {
  nameFilter: string;
  setNameFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  statusOptions: string[];
  locationOptions: string[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  resultCount: number;
  totalCount: number;
}

export const CandidateTableFilters = ({
  nameFilter,
  setNameFilter,
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  dateRange,
  setDateRange,
  statusOptions,
  locationOptions,
  hasActiveFilters,
  clearFilters,
  resultCount,
  totalCount,
}: CandidateTableFiltersProps) => {
  return (
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
      <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-input text-sm">
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
        {resultCount} / {totalCount} candidates
      </span>
    </div>
  );
};
