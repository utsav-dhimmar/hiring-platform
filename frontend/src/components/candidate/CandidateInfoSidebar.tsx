import type { ReactElement } from "react";
import { Card } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import type { CandidateResponse } from "@/types/resume";

/**
 * Props for the CandidateInfoSidebar component.
 */
interface CandidateInfoSidebarProps {
  /** The candidate data to display in the sidebar */
  candidate: CandidateResponse;
}

/**
 * Sidebar component displaying key information about a candidate.
 * Shows email, resume score, and current application status.
 */
const CandidateInfoSidebar = ({ candidate }: CandidateInfoSidebarProps): ReactElement => {
  return (
    <Card className="border-0 shadow-sm rounded-4">
      <div className="p-4">
        <h6 className="text-sm font-bold uppercase text-muted-foreground mb-3 tracking-wide">
          Candidate Info
        </h6>
        <div className="mb-3 pb-3 border-b border-border">
          <small className="text-muted-foreground block mb-1">Email Address</small>
          <p className="mb-0 font-medium">{candidate.email}</p>
        </div>
        <div className="mb-3 pb-3 border-b border-border">
          <small className="text-muted-foreground block mb-1">Resume Score</small>
          <div className="flex items-center">
            <h4 className="mb-0 font-bold">{candidate.resume_score?.toFixed(1)}%</h4>
            <Badge variant="secondary" className="ml-2 rounded-full bg-primary/10 text-primary">
              Top 10%
            </Badge>
          </div>
        </div>
        <div>
          <small className="text-muted-foreground block mb-1">Current Status</small>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {candidate.current_status || "In Process"}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default CandidateInfoSidebar;
