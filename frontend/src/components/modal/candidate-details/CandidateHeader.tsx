import { User } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import type { CandidateResponse } from "@/types/resume";
import type { CandidateAnalysis } from "@/types/admin";

/**
 * Props for {@link CandidateHeader}.
 */
interface CandidateHeaderProps {
  candidate: CandidateResponse | CandidateAnalysis;
}

/**
 * Dialog title section that displays the candidate's avatar icon and full name.
 * Renders the last name in the primary accent color.
 */
export function CandidateHeader({ candidate }: CandidateHeaderProps) {
  return (
    <DialogTitle className="flex items-start gap-3 pr-10 sm:items-center sm:gap-4">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 sm:h-11 sm:w-11">
        <User className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>

      <div className="flex min-w-0 flex-col text-left gap-1">
        <span className="text-[10px] uppercase font-black tracking-[0.2em] ">
          Candidate Profile
        </span>
        <span className="break-words text-lg font-black tracking-tight text-foreground sm:text-xl md:text-2xl">
          {candidate.first_name}{" "}
          <span className="text-primary">{candidate.last_name}</span>
        </span>
      </div>
    </DialogTitle>
  );
}
