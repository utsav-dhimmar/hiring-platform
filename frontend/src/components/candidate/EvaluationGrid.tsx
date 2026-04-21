import { EvaluationCard } from "./EvaluationCard";

export interface EvaluationData {
  /** AI reasoning for this evaluation */
  reasoning: string;
  /** Score given (out of 5) */
  score: number;
  /** Confidence level (0-1) */
  confidence: number;
}

interface EvaluationGridProps {
  /** Record of evaluation category name to evaluation data */
  data: Record<string, EvaluationData>;
}

/**
 * Grid layout for rendering multiple evaluation cards.
 * Maps over data object to display category-wise AI evaluations.
 */
export function EvaluationGrid({ data }: EvaluationGridProps) {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(data).map(([key, item]) => (
        <EvaluationCard
          key={key}
          title={key}
          reasoning={item.reasoning}
          score={item.score}
          confidence={item.confidence}
        />
      ))}
    </div>
  );
}
