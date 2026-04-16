import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, X, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, capitalize } from "@/lib/utils";
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

interface JobTableFiltersProps {
  titleFilter: string;
  setTitleFilter: (value: string) => void;
  statusFilter: string[];
  setStatusFilter: (value: string[]) => void;
  departmentFilter: string[];
  setDepartmentFilter: (value: string[]) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  departmentOptions: string[];
  departmentSearch: string;
  setDepartmentSearch: (value: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  resultCount: number;
  totalCount: number;
  minDate: Date
}

export const JobTableFilters = ({
  titleFilter,
  setTitleFilter,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  dateRange,
  setDateRange,
  departmentOptions,
  departmentSearch,
  setDepartmentSearch,
  hasActiveFilters,
  clearFilters,
  resultCount,
  totalCount,
  minDate,
}: JobTableFiltersProps) => {
  const statusOptions = ["active", "inactive"];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/30 rounded-2xl border border-muted-foreground/10">
      {/* Title Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Input
          placeholder="Search job title..."
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          className="pl-9 h-9 rounded-xl text-sm border-border/50 focus:ring-primary/20"
        />
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Status Dropdown */}
      <DropdownMenu>
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
                closeOnClick={true} // close the dropdown after selecting option
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
                  closeOnClick={true} // close the dropdown after selecting option
                >
                  Clear statuses
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Department Dropdown */}
      {departmentOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
              departmentFilter.length > 0
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {departmentFilter.length === 0
              ? "All Departments"
              : departmentFilter.length === 1
                ? departmentFilter[0]
                : `${departmentFilter.length} departments`}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px] p-2">
            <div className="px-1 pb-2">
              <div className="relative">
                <Input
                  placeholder="Search departments..."
                  value={departmentSearch}
                  onChange={(e) => setDepartmentSearch(e.target.value)}
                  className="h-9 rounded-xl text-xs pl-2"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              <DropdownMenuGroup>
                {departmentOptions.length === 0 ? (
                  <div className="px-2 py-4 text-xs text-center text-muted-foreground">
                    not found "{departmentSearch}"
                  </div>
                ) : (
                  departmentOptions.map((d) => (
                    <DropdownMenuCheckboxItem
                      key={d}
                      checked={departmentFilter.includes(d)}
                      onSelect={(e) => e.preventDefault()}
                      onClick={() =>
                        setDepartmentFilter(
                          departmentFilter.includes(d)
                            ? departmentFilter.filter((v) => v !== d)
                            : [...departmentFilter, d]
                        )
                      }
                      closeOnClick={true} // close the dropdown after selecting option
                    >
                      {d}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuGroup>
            </div>
            {departmentFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onClick={() => setDepartmentFilter([])}
                  closeOnClick={true} // close the dropdown after selecting option
                >
                  Clear departments
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Date Range Picker */}
      <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-input text-sm bg-background/50">
        <Popover>
          <PopoverTrigger
            className={cn(
              "inline-flex items-center h-7 px-2 text-xs font-normal rounded-md bg-transparent hover:bg-transparent focus-visible:outline-none transition-colors",
              !dateRange?.from && "text-muted-foreground hover:text-foreground"
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
              <span>Created date range</span>
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

      {/* Clear Button */}
      {
        hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-destructive/5 transition-all"
            onClick={clearFilters}
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        )
      }

      {/* Result Count */}
      <span className="ml-auto text-xs font-medium flex items-center gap-2">
        {/* {resultCount} / {totalCount} jobs found */}
        Total <span className="font-bold">{totalCount}</span> Jobs
        <Separator orientation="vertical" className="h-4  bg-gray-700 dark:bg-gray-300" />
        <span className="font-bold">{resultCount}</span> Jobs found
      </span>
    </div >
  );
};
