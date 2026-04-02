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
    <div className="flex bg-background/50 rounded-xl p-1 gap-1 border border-muted-foreground/5">
      <Button
        variant={activeTab === "analysis" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-lg h-8 text-[10px] font-black uppercase tracking-wider"
        onClick={() => setActiveTab("analysis")}
      >
        Analysis
      </Button>
      <Button
        variant={activeTab === "jd" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-lg h-8 text-[10px] font-black uppercase tracking-wider"
        onClick={() => setActiveTab("jd")}
      >
        JD Version
      </Button>
    </div>
  );
}
