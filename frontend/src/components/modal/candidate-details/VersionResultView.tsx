import { useState, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Loader2 } from "lucide-react";
import type { CandidateAnalysis } from "@/types/admin";
import type { Job } from "@/types/job";
import { AnalysisContent } from "./AnalysisContent";

interface VersionResultViewProps {
  candidate: CandidateAnalysis;
  job: Job | null;
  showAllSkills: boolean;
  setShowAllSkills: (show: boolean) => void;
}

/**
 * VersionResultView Component
 * 
 * Displays screening results filtered by JD versions on which the resume was processed.
 * Reuses AnalysisContent to maintain a consistent UI across analysis views.
 */
export function VersionResultView({ 
  candidate, 
  showAllSkills, 
  setShowAllSkills 
}: VersionResultViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // For now, we use a mock results list until the backend history API is implemented
  const results = useMemo(() => {
    const currentVersion = (candidate as any).applied_version_number || 1;
    
    // Primary entry from current candidate data
    const list = [{
      version: currentVersion,
      score: candidate.resume_score || 0,
      analysis: candidate.resume_analysis?.match_percentage ? candidate.resume_analysis : null,
      timestamp: candidate.created_at
    }];

    // Mock entry to demonstrate dropdown (only if current is not V1)
    if (currentVersion > 1) {
      list.push({
        version: 1,
        score: 55,
        analysis: null,
        timestamp: new Date(new Date(candidate.created_at).getTime() - 86400000).toISOString()
      });
    }

    return list.sort((a, b) => b.version - a.version);
  }, [candidate]);

  const [selectedVersion, setSelectedVersion] = useState(String(results[0].version));
  
  const activeResult = useMemo(() => 
    results.find(r => String(r.version) === selectedVersion) || results[0],
  [selectedVersion, results]);

  // Simulate loading when version changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [selectedVersion]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            JD Version Result
          </h3>
          <p className="text-sm text-muted-foreground">
            Historical screening performance for this candidate.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-xl border border-muted-foreground/10 px-4">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider whitespace-nowrap">
            Select Version:
          </span>
          <Select 
            value={selectedVersion} 
            onValueChange={(val) => val && setSelectedVersion(val)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[100px] rounded-lg border-muted-foreground/5 h-8 text-xs font-bold shadow-none bg-background">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-muted-foreground/10">
              {results.map((r) => (
                <SelectItem key={r.version} value={String(r.version)} className="rounded-lg text-xs font-medium">
                  Version V{r.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px] z-10 rounded-2xl animate-in fade-in">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-sm font-bold text-muted-foreground animate-pulse">
              Loading Analysis for V{selectedVersion}...
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            {activeResult.analysis ? (
              <AnalysisContent
                candidate={candidate}
                showAllSkills={showAllSkills}
                setShowAllSkills={setShowAllSkills}
                analysisOverride={activeResult.analysis}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-muted-foreground/10">
                <div className="p-4 bg-muted/30 rounded-full mb-4">
                  <History className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">Detailed Analysis Archived</h4>
                <p className="text-xs text-muted-foreground italic max-w-[280px]">
                  Archived analysis breakdown for JD Version {activeResult.version} is not available in the current history.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
