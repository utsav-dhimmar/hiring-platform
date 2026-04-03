import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Input } from "@/components/";
import { FileText, RotateCw, Info, Compass } from "lucide-react";
import { CandidateDetailsModal, JobInfoModal } from "@/components/modal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import CandidateTable from "@/components/candidate/CandidateTable";
import { useJobCandidates } from "@/hooks/useJobCandidates";
import { JobCandidatesSkeleton } from "@/components/candidate/JobCandidatesSkeleton";
import { JobCandidatesStats } from "@/components/candidate/JobCandidatesStats";
import { JobCandidatesHeader } from "@/components/candidate/JobCandidatesHeader";
import type { CandidateAnalysis } from "@/types/admin";
import { AppPageShell } from "@/components/shared";

export default function JobCandidates() {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    candidates,
    job,
    loading,
    isUploading,
    reanalyzingCandidateIds,
    fetchData,
    handleFileChange,
    handleReanalyzeCandidate,
    handleReanalyzeAll,
    handleToggleStatus,
    needsReanalysis,
    stats,
  } = useJobCandidates(jobSlug);

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAnalysis | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<"analysis" | "jd" | "discovery">("analysis");

  const handleUploadClick = () => {
    if (!job?.is_active) return;
    fileInputRef.current?.click();
  };

  return (
    <AppPageShell width="wide" className="animate-in fade-in duration-500">
      <JobCandidatesHeader
        job={job}
        onBack={() => navigate("/dashboard/jobs")}
        onInfoClick={() => setIsJobModalOpen(true)}
        onUploadClick={handleUploadClick}
        onToggleStatus={handleToggleStatus}
        isUploading={isUploading}
      />

      {!loading && candidates?.length > 0 && (
        <JobCandidatesStats
          totalCandidates={stats.totalCandidates}
          approveCount={stats.approveCount}
          rejectCount={stats.rejectCount}
          maybeCount={stats.maybeCount}
          undecidedCount={stats.undecidedCount}
        />
      )}

      <div className="app-surface-card p-3 sm:p-4">
        {loading ? (
          <JobCandidatesSkeleton count={5} />
        ) : candidates?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 animate-in zoom-in-95 duration-700">
            <div className="p-8 bg-muted/40 rounded-full ring-4 ring-muted/10">
              <FileText className="h-16 w-16 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">No applicants found</h3>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-5 duration-700">
            <CandidateTable
              candidates={candidates}
              passing_threshold={job?.passing_threshold}
              headerActions={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 hover:bg-amber-500/10 text-amber-600 hover:text-amber-700 font-semibold transition-all flex items-center gap-2 h-10 rounded-xl"
                  onClick={handleReanalyzeAll}
                  disabled={candidates.filter(needsReanalysis).length === 0}
                  title={
                    candidates.filter(needsReanalysis).length === 0
                      ? "All candidates are analyzed with the latest JD version"
                      : `Re-analyze ${candidates.filter(needsReanalysis).length} candidate(s) that need it`
                  }
                >
                  <RotateCw className="h-4 w-4" />
                  Reanalyze All
                </Button>
              }
              renderActions={(candidate) => (
                <div className="flex items-center gap-2 justify-end">
                  <HoverCard>
                    <HoverCardTrigger
                      render={(props) => (
                        <Button
                          {...props}
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 rounded-xl border border-amber-300 hover:bg-amber-500/10 transition-all duration-300 flex items-center justify-center shrink-0"
                          onClick={(e) => {
                            if (props.onClick) props.onClick(e);
                            handleReanalyzeCandidate(candidate.id);
                          }}
                          isLoading={reanalyzingCandidateIds.includes(candidate.id)}
                          disabled={
                            !needsReanalysis(candidate) ||
                            reanalyzingCandidateIds.includes(candidate.id)
                          }
                          title={
                            !needsReanalysis(candidate)
                              ? "Already analyzed with the latest JD version"
                              : "Re-analyze with the latest JD version"
                          }
                        >
                          <RotateCw className="h-4 w-4 text-amber-600 shrink-0" />
                        </Button>
                      )}
                    />
                    <HoverCardContent side="top" className="w-auto p-2 min-w-0">
                      <div className="text-sm font-semibold text-amber-700">Reanalyze</div>
                    </HoverCardContent>
                  </HoverCard>
                  <HoverCard>
                    <HoverCardTrigger
                      render={(props) => (
                        <Button
                          {...props}
                          variant="secondary"
                          size="sm"
                          className="h-9 w-9 p-0 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all duration-300 border border-muted-foreground/10 flex items-center justify-center shrink-0"
                          onClick={(e) => {
                            if (props.onClick) props.onClick(e);
                            setSelectedCandidate(candidate);
                            setModalInitialTab("analysis");
                            setIsModalOpen(true);
                          }}
                        >
                          <Info className="h-4 w-4 shrink-0" />
                        </Button>
                      )}
                    />
                    <HoverCardContent side="top" className="w-auto p-2 min-w-0">
                      <div className="text-sm font-semibold">More Info</div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )}
            />
          </div>
        )}
      </div>

      <CandidateDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        candidate={selectedCandidate}
        jobId={job?.id}
        onDecisionSubmitted={() => fetchData()}
        initialTab={modalInitialTab}
        passing_threshold={job?.passing_threshold}
      />

      <JobInfoModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        job={job}
      />

      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
      />
    </AppPageShell>
  );
}
