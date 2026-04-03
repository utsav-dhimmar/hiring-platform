import { Button } from "@/components/ui/button";

/**
 * Props for {@link AnalysisTabs}.
 */
interface AnalysisTabsProps {
  activeTab: "analysis" | "jd";
  setActiveTab: (tab: "analysis" | "jd") => void;
}

/**
 * Tab switcher between the "Analysis" and "JD Version" views inside the
 * candidate details modal.
 */
export function AnalysisTabs({ activeTab, setActiveTab }: AnalysisTabsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-muted-foreground/5 bg-background/50 p-1 sm:flex sm:w-auto">
      <Button
        variant={activeTab === "analysis" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider"
        onClick={() => setActiveTab("analysis")}
      >
        Analysis
      </Button>
      <Button
        variant={activeTab === "jd" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider"
        onClick={() => setActiveTab("jd")}
      >
        JD Version
      </Button>
    </div>
  );
}
