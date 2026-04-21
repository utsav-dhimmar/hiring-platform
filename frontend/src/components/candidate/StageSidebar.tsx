import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StageSidebarProps {
  /** Available stage names */
  stages: string[];
  /** Currently selected stage */
  currentStage: string;
  /** Callback when stage is selected */
  onStageSelect: (stage: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sidebar for selecting hiring stages with search functionality.
 * Displays a scrollable list of stage buttons with active state highlighting.
 */
export function StageSidebar({
  stages,
  currentStage,
  onStageSelect,
  className,
}: StageSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-[280px] h-full bg-background border-r p-6", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Any be Search Bar"
          className="pl-9 bg-muted/30 border-primary/10 rounded-xl focus-visible:ring-primary/20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em] mb-2 px-2">
          Hiring Stages
        </h2>
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => onStageSelect(stage)}
            className={cn(
              "flex items-center w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border-2",
              currentStage === stage
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                : "bg-background text-foreground border-primary/10 hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            {stage}
          </button>
        ))}
      </div>
    </div>
  );
}
