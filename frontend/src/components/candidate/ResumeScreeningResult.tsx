import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CandidateResponse } from "@/types/resume";
import { UserCheck, ThumbsUp, AlertTriangle, Info } from "lucide-react";

interface ResumeScreeningResultProps {
  candidate: CandidateResponse;
}

const ResumeScreeningResult = ({ candidate }: ResumeScreeningResultProps) => {
  const analysis = candidate.resume_analysis;

  if (!analysis) {
    return (
      <Card className="border-0 shadow-sm rounded-4">
        <div className="p-5 text-center">
          <div className="mb-3 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <h5>No Resume Analysis Available</h5>
          <p className="text-muted-foreground">
            The resume for this candidate hasn't been analyzed yet or the analysis failed.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="resume-screening-result">
      <Card className="mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="bg-white px-4 py-3 border-b flex justify-between items-center">
          <h5 className="mb-0 font-bold">Stage 0: Resume Screening Results</h5>
          <Badge
            variant={
              candidate.resume_score && candidate.resume_score >= 70 ? "default" : "secondary"
            }
            className="rounded-full px-3 py-1"
          >
            Match Score: {candidate.resume_score?.toFixed(1)}%
          </Badge>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-12">
              <div className="mb-4">
                <h6 className="text-sm font-bold uppercase text-muted-foreground mb-3 tracking-wide flex items-center">
                  <UserCheck className="h-4 w-4 mr-2 text-primary" />
                  Experience Alignment
                </h6>
                <div className="p-3 bg-muted rounded-lg border-0 text-foreground leading-relaxed">
                  {analysis.experience_alignment}
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-sm font-bold uppercase text-muted-foreground mb-3 tracking-wide flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                  Strength Summary
                </h6>
                <div className="p-3 bg-muted rounded-lg border-0 text-foreground leading-relaxed">
                  {analysis.strength_summary}
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-sm font-bold uppercase text-muted-foreground mb-3 tracking-wide flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                  Skill Gap Analysis
                </h6>
                <div className="p-3 bg-muted rounded-lg border-0 text-foreground leading-relaxed">
                  {analysis.skill_gap_analysis}
                </div>
              </div>
            </div>

            <div className="md:col-span-6">
              <h6 className="text-sm font-bold uppercase text-muted-foreground mb-3 tracking-wide">
                Missing Skills
              </h6>
              {analysis.missing_skills && analysis.missing_skills.length > 0 ? (
                <div className="rounded-lg border divide-y">
                  {analysis.missing_skills.map((skill, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 px-3">
                      <span>{skill.name}</span>
                      <Badge variant="secondary" className="rounded-full">
                        Importance: {skill.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">No critical skills missing.</p>
              )}
            </div>

            <div className="md:col-span-6">
              <h6 className="text-sm font-bold uppercase text-muted-foreground mb-3 tracking-wide">
                Extraordinary Points
              </h6>
              {analysis.extraordinary_points && analysis.extraordinary_points.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.extraordinary_points.map((point, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 rounded-full">
                      {point}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No extraordinary points noted.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 p-4 bg-primary/10 rounded-lg border-0">
            <div className="flex items-center mb-2">
              <div
                className="bg-primary text-primary-foreground rounded-full p-1.5 mr-3 flex items-center justify-center"
                style={{ width: "32px", height: "32px" }}
              >
                <Info className="h-4 w-4" />
              </div>
              <h6 className="text-primary font-bold mb-0">Status Note</h6>
            </div>
            <p className="mb-0 text-primary/80">
              Candidate passed the initial screening with a match score of{" "}
              <strong>{candidate.resume_score?.toFixed(1)}%</strong>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResumeScreeningResult;
