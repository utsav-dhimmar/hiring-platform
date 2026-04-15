import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input } from "@/components/";
import { RotateCw, Info, LayoutGrid, TrendingUp } from "lucide-react";
import { CandidateDetailsModal, JobInfoModal, DeleteModal } from "@/components/modal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import CandidateTable from "@/components/candidate/CandidateTable";
import { useJobCandidates } from "@/hooks/useJobCandidates";
import { JobCandidatesSkeleton } from "@/components/candidate/JobCandidatesSkeleton";
import { JobCandidatesStats } from "@/components/candidate/JobCandidatesStats";
import { JobCandidatesHeader } from "@/components/candidate/JobCandidatesHeader";
import PermissionGuard from "@/components/auth/PermissionGuard";
import type { CandidateAnalysis } from "@/types/admin";
import AppPageShell from "@/components/shared/AppPageShell";
import { CandidatesDistributionChart } from "@/components/shared/BarChart";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { PaginationState } from "@tanstack/react-table";



export default function JobCandidates() {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    candidates,
    job,
    loading,
    isRefreshing,
    isUploading,
    reanalyzingCandidateIds,
    fetchData,
    handleFileChange,
    handleReanalyzeCandidate,
    handleReanalyzeAll,
    handleToggleStatus,
    needsReanalysis,
    stats,
    jdVersion,
    setJdVersion,
    totalCandidates,
    // handleDeleteClick,
    showDeleteModal,
    handleCloseDelete,
    handleConfirmDelete,
    isDeleting,
    deleteError,
    deleteMessage,
  } = useJobCandidates(jobSlug, pageIndex, pageSize);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAnalysis | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<"analysis" | "jd" | "cross-job-match">("analysis");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");
  const [searchParams] = useSearchParams();

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [searchParams]);

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
        jdVersion={jdVersion}
        setJdVersion={setJdVersion}
      />

      {/* Unified Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">


          {/* Pill Toggle Switcher */}
          <div className="flex bg-muted/50 p-1 rounded-full border border-muted-foreground/10 shadow-inner">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-500",
                activeTab === "overview"
                  ? "bg-background text-primary shadow-lg scale-100"
                  : "text-muted-foreground hover:text-foreground scale-95"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-500",
                activeTab === "analytics"
                  ? "bg-background text-primary shadow-lg scale-100"
                  : "text-muted-foreground hover:text-foreground scale-95"
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Analytics
            </button>
          </div>
        </div>

        <div className="relative min-h-[160px]">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 rounded-3xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className={cn(
              "animate-in fade-in slide-in-from-bottom-2 duration-700",
              isRefreshing && "opacity-60 transition-opacity duration-300"
            )}>
              {activeTab === "overview" ? (
                <JobCandidatesStats
                  totalCandidates={stats.totalCandidates}
                  approveCount={stats.approveCount}
                  rejectCount={stats.rejectCount}
                  maybeCount={stats.maybeCount}
                  undecidedCount={stats.undecidedCount}
                />
              ) : (

                <div className="flex flex-col md:flex-row gap-8 items-center ">
                  <div className="w-full h-[300px]">
                    <CandidatesDistributionChart stats={stats} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Candidate List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-foreground">Candidate Pool</h2>
        </div>
        <div className="app-surface-card p-0 overflow-hidden border-muted-foreground/10 shadow-xl">
          {loading ? (
            <div className="p-4">
              <JobCandidatesSkeleton count={5} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-1000 relative">
              <CandidateTable
                emptyMessage="No candidates found for this job."
                candidates={candidates}
                passing_threshold={job?.passing_threshold}
                isServerSide={true}
                showLocationFilter={true}
                showStatusFilter={true}
                pagination={{ pageIndex, pageSize }}
                onPaginationChange={setPagination}
                pageCount={Math.ceil(totalCandidates / pageSize)}
                total={totalCandidates}
                headerActions={
                  <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
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
                  </PermissionGuard>
                }
                renderActions={(candidate) => (
                  <div className="flex items-center gap-2 justify-end">
                    <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
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
                    </PermissionGuard>
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
                    {/* <HoverCard>
                      <HoverCardTrigger
                        render={(props) => (
                          <Button
                            {...props}
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all duration-300 border border-muted-foreground/10 flex items-center justify-center shrink-0"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              handleDeleteClick(candidate);
                            }}
                          >
                            <Trash className="h-4 w-4 shrink-0" />
                          </Button>
                        )} />

                      <HoverCardContent side="top" className="w-auto p-2 min-w-0">
                        <div className="text-sm font-semibold">Delete</div>
                      </HoverCardContent>
                    </HoverCard> */}
                  </div>
                )}
              />
            </div>
          )}
        </div>
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

      <PermissionGuard permissions={PERMISSIONS.CANDIDATES_ACCESS} hideWhenDenied>
        <Input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />
      </PermissionGuard>
      <DeleteModal
        show={showDeleteModal}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete Candidate"
        message={deleteMessage}
        isLoading={isDeleting}
        error={deleteError}
      />
    </AppPageShell>
  );
}
