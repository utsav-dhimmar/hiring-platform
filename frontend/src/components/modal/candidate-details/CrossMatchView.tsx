import { useState, useEffect, useCallback } from "react";
import { crossMatchApi } from "@/apis/crossMatch";
import { Loader2, Search, ExternalLink, RefreshCw, Compass, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CrossJobMatchRead } from "@/types/crossMatch";
import { useNavigate } from "react-router-dom";
import { slugify } from "@/utils/slug";
import { capitalize } from "@/lib/utils";
import { extractErrorMessage } from "@/utils/error";
interface CrossMatchViewProps {
  resumeId?: string;
  candidateId?: string;
  onClose?: () => void;
}

/**
 * CrossMatchView Component
 * 
 * Displays and manages the "Discovery (Cross-Job Match)" feature.
 * Allows triggering a background matching process and polls for results.
 */
export function CrossMatchView({ resumeId, onClose }: CrossMatchViewProps) {
  const [matches, setMatches] = useState<CrossJobMatchRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "failed">("all");
  const navigate = useNavigate();

  const fetchMatches = useCallback(async () => {
    if (!resumeId) return;
    try {
      const data = await crossMatchApi.getCrossMatches(resumeId);
      const matchesArray = Object.values(data.matches);
      setMatches(matchesArray);

      // Check if any match is "new" (created after our start time)
      if (isDiscovering && startTime) {
        const hasNewMatches = matchesArray.some(
          (m) => new Date(m.created_at).getTime() > (startTime - 5000) // Small buffer
        );
        if (hasNewMatches) {
          setIsDiscovering(false);
          setStartTime(null);
          toast.success("Discovery complete! Found potential matches.");
        }
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      console.error(errorMessage || "Failed to fetch matches:", error);
    } finally {
      setLoading(false);
    }
  }, [resumeId, isDiscovering, startTime]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Polling logic
  useEffect(() => {
    if (isDiscovering) {
      const interval = setInterval(() => {
        fetchMatches();
      }, 3000);

      // Automatic timeout after 25 seconds
      const timeout = setTimeout(() => {
        if (isDiscovering) {
          setIsDiscovering(false);
          setStartTime(null);
          toast.info("Scanning completed. Check results below.");
        }
      }, 25000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isDiscovering, fetchMatches]);

  const handleTrigger = async () => {
    if (!resumeId) return;
    setIsDiscovering(true);
    setStartTime(Date.now());
    try {
      await crossMatchApi.triggerCrossMatch(resumeId);
      toast.info("Discovery triggered. Scanning all active jobs...");
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage || "Failed to trigger discovery.");
      setIsDiscovering(false);
      setStartTime(null);
    }
  };

  const handleGoToJob = (jobTitle: string, jobId: string) => {
    if (onClose) onClose();
    navigate(`/dashboard/jobs/${slugify(jobTitle)}/candidates`, { state: { jobId } });
  };

  const filteredMatches = matches.filter((match) => {
    if (statusFilter === "all") return true;
    const isPassed = match.match_score >= (match.matched_job?.passing_threshold ?? 65);
    return statusFilter === "passed" ? isPassed : !isPassed;
  });

  if (!resumeId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/10 rounded-2xl border border-dashed border-muted-foreground/20">
        <div className="p-4 bg-muted/20 rounded-full mb-4">
          <Search className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-muted-foreground font-medium">No resume found for this candidate.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Cross-match requires a parsed resume.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Cross Job Match
          </h3>
          <p className="text-sm text-muted-foreground">
            Identify matches for this candidate across other open active positions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => value && setStatusFilter(value)}
          >
            <SelectTrigger className="w-[110px] h-10 rounded-xl" size="sm">
              {/* <Filter className="mr-2 h-3.5 w-3.5" /> */}
              <SelectValue placeholder="Filter">
                {/* {statusFilter === "all" ? "All Results" : capitalize(statusFilter)} */}
                {capitalize(statusFilter)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleTrigger}
            disabled={isDiscovering}
            className="rounded-xl h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {matches.length > 0 ? "Re-Cross Job Match" : "Cross Job Match"}
              </>
            )}
          </Button>
        </div>
      </div>

      {isDiscovering && (
        <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col items-center gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-primary font-semibold text-sm">Analyzing all active jobs...</span>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            This will check against all active jobs and find matches for this candidate.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading matches...</p>
        </div>
      ) : matches.length > 0 ? (
        <div className="max-h-[400px] w-full rounded-2xl border border-border bg-muted/5 p-4 overflow-y-auto custom-scrollbar">
          {filteredMatches.length > 0 ? (
            <div className="grid gap-4">
              {filteredMatches.map((match) => (
                <div
                  key={match.matched_job_id}
                  className="group p-4 bg-card hover:bg-muted/40 border border-border rounded-xl transition-all duration-300 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {match.matched_job?.title || "Unknown Job"}
                      </span>
                      <Badge variant="outline" className="bg-muted text-[10px] font-bold px-1.5 py-0">
                        {match.matched_job?.department_name || "N/A"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${match.match_score}%` }}
                          />
                        </div>
                        <span className="font-black text-blue-600 tracking-tight">{(match.match_score)}% Match</span>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`
                        text-[10px] h-4.5 px-2 font-black border-none transition-all
                        ${match.match_score >= (match.matched_job?.passing_threshold ?? 65)
                            ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20"
                          }
                      `}
                      >
                        {match.match_score >= (match.matched_job?.passing_threshold ?? 65) ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg h-9 hover:bg-primary/10 hover:text-primary border border-border"
                    onClick={() => handleGoToJob(match.matched_job?.title || "", match.matched_job_id)}
                  >
                    View Job
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Filter className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">No matches found for the "{statusFilter}" filter.</p>
            </div>
          )}
        </div>
      ) : !isDiscovering && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/5 rounded-2xl border border-dashed border-border">
          <Compass className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h4 className="font-bold text-foreground">No matches found yet</h4>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Click "Cross Job Match" to scan this candidate against all active jobs.
          </p>
        </div>
      )}
    </div>
  );
}
