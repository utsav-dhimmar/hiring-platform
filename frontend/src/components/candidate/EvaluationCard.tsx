import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EvaluationCardProps {
  /** Title of the evaluation category */
  title: string;
  /** AI-generated reasoning for the evaluation */
  reasoning: string;
  /** Score given (out of maxScore) */
  score: number;
  /** Maximum possible score (default: 5) */
  maxScore?: number;
  /** Confidence level of the evaluation (0-1) */
  confidence: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card displaying single evaluation category with score, reasoning, and confidence.
 * Used in the evaluation grid to show AI assessment results.
 */
export function EvaluationCard({
  title,
  reasoning,
  score,
  maxScore = 5,
  confidence,
  className,
}: EvaluationCardProps) {
  return (
    <Card className={cn("border border-primary/20 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden w-full p-1 pt-2", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold capitalize text-primary tracking-tight">
            {title.replace(/_/g, " ")}
          </h3>

          <div className="space-y-1">
            <p>
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Reasoning:</span>
              <span className="text-sm text-foreground/80 leading-relaxed font-medium ">
                {reasoning}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-8 mt-2 pt-4 border-t border-primary/10">
            <div className="flex flex-col">
              <span className="font-bold uppercase text-muted-foreground tracking-tighter">Score</span>
              <span className="text-sm font-black text-primary">
                {score}/{maxScore}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold uppercase text-muted-foreground tracking-tighter">Confidence</span>
              <span className="text-sm font-black text-primary">
                {confidence.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
