/**
 * Modal component for displaying detailed candidate information.
 * Shows contact info, screening overview, and AI-powered resume analysis.
 */

import type { CandidateResponse, MissingSkill } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CandidateDetailModalProps {
  /** Controls visibility of the modal */
  show: boolean;
  /** Callback to close the modal */
  onHide: () => void;
  /** The candidate data to display */
  candidate: CandidateResponse | null;
}

const formatMissingSkill = (skill: MissingSkill | string) =>
  typeof skill === "string" ? skill : `${skill.name} (${skill.score.toFixed(0)}%)`;

const CandidateDetailModal = ({ show, onHide, candidate }: CandidateDetailModalProps) => {
  console.log(candidate);
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Candidate Profile: {candidate?.first_name} {candidate?.last_name}
          </DialogTitle>
        </DialogHeader>
        {candidate && (
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="border-b pb-2">Contact Information</h5>
                <p className="mb-1">
                  <strong>Email:</strong> {candidate.email}
                </p>
                <p className="mb-1">
                  <strong>Phone:</strong> {candidate.phone || "N/A"}
                </p>
                <p className="mb-1">
                  <strong>Current Status:</strong> {candidate.current_status || "Applied"}
                </p>
              </div>
              <div>
                <h5 className="border-b pb-2">Screening Overview</h5>
                <p className="mb-1">
                  <strong>Score:</strong>{" "}
                  {candidate.resume_score !== null ? (
                    <Badge variant={candidate.resume_score >= 65 ? "default" : "secondary"}>
                      {candidate.resume_score.toFixed(1)}%
                    </Badge>
                  ) : (
                    "N/A"
                  )}
                </p>
                <p className="mb-1">
                  <strong>Pass/Fail:</strong>{" "}
                  {candidate.pass_fail !== null ? (
                    <Badge variant={candidate.pass_fail ? "default" : "destructive"}>
                      {candidate.pass_fail ? "PASS" : "FAIL"}
                    </Badge>
                  ) : (
                    "PENDING"
                  )}
                </p>
                <p className="mb-1">
                  <strong>Parsing:</strong>{" "}
                  {candidate.is_parsed ? (
                    "Success"
                  ) : candidate.processing_status === "failed" ? (
                    <span className="text-red-500">Failed</span>
                  ) : (
                    "Pending"
                  )}
                </p>
                {candidate.processing_status === "failed" && candidate.processing_error && (
                  <p className="mb-1 text-red-500 text-sm">
                    <strong>Error:</strong> {candidate.processing_error}
                  </p>
                )}
              </div>
            </div>

            {candidate.resume_analysis ? (
              <>
                <div className="mb-4">
                  <h5 className="border-b pb-2">Strength Summary</h5>
                  <p className="text-muted-foreground">
                    {candidate.resume_analysis.strength_summary}
                  </p>
                </div>

                <div className="mb-4">
                  <h5 className="border-b pb-2">Experience Alignment</h5>
                  <p className="text-muted-foreground">
                    {candidate.resume_analysis.experience_alignment}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-3">
                    <h5 className="border-b pb-2">Missing Skills</h5>
                    {candidate.resume_analysis.missing_skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {candidate.resume_analysis.missing_skills.map((skill, idx) => (
                          <Badge key={idx} variant="destructive" className="font-normal">
                            {formatMissingSkill(skill)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-green-500 text-sm">No major missing skills identified.</p>
                    )}
                  </div>
                  <div>
                    <h5 className="border-b pb-2">Extraordinary Points</h5>
                    {candidate.resume_analysis.extraordinary_points?.length > 0 ? (
                      <ul className="list-disc pl-3 mb-0 text-sm">
                        {candidate.resume_analysis.extraordinary_points.map((point, idx) => (
                          <li key={idx} className="text-green-500 mb-1">
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">None identified.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 bg-muted rounded">
                <p className="text-muted-foreground mb-0">
                  No detailed AI analysis available for this candidate.
                </p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetailModal;
