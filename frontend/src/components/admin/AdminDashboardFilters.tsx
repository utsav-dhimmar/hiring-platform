import type { JobTitle } from "@/types/job";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Briefcase, ChevronDown, Layers, Building2 } from "lucide-react";

interface AdminDashboardFiltersProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  departments: string[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  jobs: JobTitle[];
  filteredJobs: JobTitle[];
  selectedStageName: string;
  setSelectedStageName: (name: string) => void;
  stages: { name: string }[];
}
/**
 * Filter component for admin dashboard
 * @param selectedDepartment - Currently selected department
 * @param setSelectedDepartment - Function to set selected department
 * @param departments - List of all departments
 * @param selectedJobId - Currently selected job
 * @param setSelectedJobId - Function to set selected job
 * @param jobs - List of all jobs
 * @param filteredJobs - List of filtered jobs
 * @param selectedStageName - Currently selected stage
 * @param setSelectedStageName - Function to set selected stage
 * @param stages - List of all stages
 */
const AdminDashboardFilters = ({
  selectedDepartment,
  setSelectedDepartment,
  departments,
  selectedJobId,
  setSelectedJobId,
  jobs,
  filteredJobs,
  selectedStageName,
  setSelectedStageName,
  stages,
}: AdminDashboardFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 px-1 animate-in fade-in slide-in-from-left-2 duration-500">
      {/* Job Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
            selectedJobId !== "all"
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Briefcase className="h-3.5 w-3.5 opacity-60" />
          <span className="truncate max-w-[150px]">
            {selectedJobId === "all"
              ? "Jobs"
              : jobs.find((j) => j.id === selectedJobId)?.title || "Selected Job"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-auto" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Select Job</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={selectedJobId === "all"}
              onClick={() => setSelectedJobId("all")}
            >
              All Jobs
            </DropdownMenuCheckboxItem>
            {filteredJobs.map((job) => (
              <DropdownMenuCheckboxItem
                key={job.id}
                checked={selectedJobId === job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={"capitalize"}
              >
                {job.title}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Stage Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
            selectedStageName !== "all"
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5 opacity-60" />
          <span className="truncate max-w-[150px]">
            {selectedStageName === "all" ? "Stages" : selectedStageName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-auto" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Select Stage</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={selectedStageName === "all"}
              onClick={() => setSelectedStageName("all")}
            >
              All Stages
            </DropdownMenuCheckboxItem>
            {stages.map((stage) => (
              <DropdownMenuCheckboxItem
                key={stage.name}
                checked={selectedStageName === stage.name}
                onClick={() => setSelectedStageName(stage.name)}
                className={"capitalize"}
              >
                {stage.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Department Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium cursor-pointer select-none transition-colors",
            selectedDepartment !== "all"
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-input bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Building2 className="h-3.5 w-3.5 opacity-60" />
          <span className="truncate max-w-[150px] capitalize">
            {selectedDepartment === "all" ? "Departments" : selectedDepartment}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-auto" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Select Department</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={selectedDepartment === "all"}
              onClick={() => setSelectedDepartment("all")}
            >
              All Departments
            </DropdownMenuCheckboxItem>
            {departments.map((dept) => (
              <DropdownMenuCheckboxItem
                key={dept}
                checked={selectedDepartment === dept}
                onClick={() => setSelectedDepartment(dept)}
                className={"capitalize"}
              >
                {dept}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AdminDashboardFilters;
