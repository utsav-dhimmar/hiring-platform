interface JobCandidatesStatsProps {
  totalCandidates: number;
  approveCount: number;
  rejectCount: number;
  maybeCount: number;
  undecidedCount: number;
}

export const JobCandidatesStats = ({
  totalCandidates,
  approveCount,
  rejectCount,
  maybeCount,
  undecidedCount,
}: JobCandidatesStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
      {/* Total Candidates */}
      <div className="group p-6 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-card/50 transition-all duration-300 border-muted-foreground/10">
        <span className="text-4xl font-black text-foreground">{totalCandidates}</span>
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
          Candidates
        </span>
      </div>

      {/* Approve */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-green-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-green-500/20">
        <span className="text-4xl font-black text-green-600">{approveCount}</span>
        <span className="text-sm font-bold text-green-600/70 uppercase tracking-widest group-hover:text-green-600 transition-colors">
          Approved
        </span>
      </div>

      {/* Reject */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-red-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-red-500/20">
        <span className="text-4xl font-black text-red-600">{rejectCount}</span>
        <span className="text-sm font-bold text-red-500/50 uppercase tracking-widest group-hover:text-red-500/80 transition-colors">
          Reject
        </span>
      </div>

      {/* Maybe */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-amber-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-amber-500/20">
        <span className="text-4xl font-black text-amber-600">{maybeCount}</span>
        <span className="text-sm font-bold text-amber-600/70 uppercase tracking-widest group-hover:text-amber-600 transition-colors">
          Maybe
        </span>
      </div>

      {/* Undecided */}
      <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-slate-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-slate-500/20">
        <span className="text-4xl font-black text-slate-600">{undecidedCount}</span>
        <span className="text-sm font-bold text-slate-600/70 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
          Undecided
        </span>
      </div>
    </div>
  );
};
