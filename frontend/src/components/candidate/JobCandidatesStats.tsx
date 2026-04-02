interface JobCandidatesStatsProps {
  totalCandidates: number;
  passedCount: number;
  failedCount: number;
  hrApprovedCount: number;
  hrMaybeCount: number;
  hrRejectedCount: number;
}

export const JobCandidatesStats = ({
  totalCandidates,
  passedCount,
  failedCount,
  hrApprovedCount,
  hrMaybeCount,
  hrRejectedCount,
}: JobCandidatesStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Total Candidates */}
      <div className="group p-6 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-card/50 transition-all duration-300 border-muted-foreground/10">
        <span className="text-4xl font-black text-foreground">{totalCandidates}</span>
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
          Candidates
        </span>
      </div>

      {/* Passed */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-green-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-green-500/20">
        <span className="text-4xl font-black text-green-600">{passedCount}</span>
        <span className="text-sm font-bold text-green-600/70 uppercase tracking-widest group-hover:text-green-600 transition-colors">
          Passed
        </span>
      </div>

      {/* Failed */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-red-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-red-500/20">
        <span className="text-4xl font-black text-red-500/80">{failedCount}</span>
        <span className="text-sm font-bold text-red-500/50 uppercase tracking-widest group-hover:text-red-500/80 transition-colors">
          Failed
        </span>
      </div>

      {/* HR Approved */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-green-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-green-500/20">
        <span className="text-4xl font-black text-green-600">{hrApprovedCount}</span>
        <span className="text-sm font-bold text-green-600/70 uppercase tracking-widest group-hover:text-green-600 transition-colors">
          HR Approved
        </span>
      </div>

      {/* HR Maybe */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-amber-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-amber-500/20">
        <span className="text-4xl font-black text-amber-600">{hrMaybeCount}</span>
        <span className="text-sm font-bold text-amber-600/70 uppercase tracking-widest group-hover:text-amber-600 transition-colors">
          HR Maybe
        </span>
      </div>

      {/* HR Rejected */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-red-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-red-500/20">
        <span className="text-4xl font-black text-red-600">{hrRejectedCount}</span>
        <span className="text-sm font-bold text-red-600/70 uppercase tracking-widest group-hover:text-red-600 transition-colors">
          HR Rejected
        </span>
      </div>
    </div>
  );
};
