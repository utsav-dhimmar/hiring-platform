import { Button } from "@/components/ui/button";

/**
 * Props for {@link AnalysisTabs}.
 */
interface AnalysisTabsProps {
  activeTab: "analysis" | "jd" | "discovery" | "version-result";
  setActiveTab: (tab: "analysis" | "jd" | "discovery" | "version-result") => void;
}

/**
 * Tab switcher between the "Analysis", "JD Version", and "Discovery" views
 * inside the candidate details modal.
 */
export function AnalysisTabs({ activeTab, setActiveTab }: AnalysisTabsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-muted-foreground/5 bg-background/50 p-1 lg:flex lg:w-auto">
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
      <Button
        variant={activeTab === "discovery" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider"
        onClick={() => setActiveTab("discovery")}
      >
        Discovery
      </Button>
      <Button
        variant={activeTab === "version-result" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider"
        onClick={() => setActiveTab("version-result")}
      >
        Version Result
      </Button>
    </div>
  );
}
