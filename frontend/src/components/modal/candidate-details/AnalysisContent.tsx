import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { CandidateResponse } from "@/types/resume";
import type { CandidateAnalysis } from "@/types/admin";
import type { ReactNode } from "react";

/**
 * Props for {@link AnalysisContent}.
 */
interface AnalysisContentProps {
  candidate: CandidateResponse | CandidateAnalysis;
  showAllSkills: boolean;
  setShowAllSkills: (show: boolean) => void;
  children?: ReactNode;
}

/**
 * Main analysis view showing strength summary, experience alignment,
 * missing skills (with expand/collapse), and extraordinary points.
 * Accepts a `children` slot so the parent can inject a screening-decision card.
 */
export function AnalysisContent({
  candidate,
  showAllSkills,
  setShowAllSkills,
  children,
}: AnalysisContentProps) {
  const analysis = candidate.resume_analysis;

  return (
    <div className="space-y-3 pb-4">
      {/* Summary Sections */}
      <div className="grid grid-cols-1 gap-3">
        <section className="space-y-2">
          <Card className="text-muted-foreground text-base leading-relaxed px-2">
            <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
              Strength Summary
            </h3>
            {analysis?.strength_summary || "No summary available."}
          </Card>
        </section>

        <section className="space-y-2">
          <Card className="text-muted-foreground text-base leading-relaxed px-2">
            <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
              Experience Alignment
            </h3>
            {analysis?.experience_alignment ||
              "No alignment details available."}
          </Card>
        </section>
      </div>

      {children}

      {/* Skills & Extraordinary Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        <section className="space-y-4">
          <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-red-500/80" />
            Missing Skills
          </h3>

          <div className="space-y-3">
            {analysis?.missing_skills && analysis.missing_skills.length > 0 ? (
              <>
                {(showAllSkills
                  ? analysis.missing_skills
                  : analysis.missing_skills.slice(0, 4)
                ).map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-colors"
                  >
                    <span className="text-sm font-bold text-red-600/80">
                      {skill.name}
                    </span>
                  </div>
                ))}
                {analysis.missing_skills.length > 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/5 mt-2"
                    onClick={() => setShowAllSkills(!showAllSkills)}
                  >
                    {showAllSkills
                      ? "Show Less"
                      : `Show ${analysis.missing_skills.length - 4} More`}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                No major missing skills identified.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            Extraordinary Points
          </h3>
          <div className="space-y-2">
            {analysis?.extraordinary_points &&
              analysis.extraordinary_points.length > 0 ? (
              analysis.extraordinary_points.map((point, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 text-sm leading-relaxed text-muted-foreground group"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 group-hover:scale-150 transition-transform" />
                  <p className="group-hover:text-foreground transition-colors">
                    {point}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No extraordinary points found from the resume.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
