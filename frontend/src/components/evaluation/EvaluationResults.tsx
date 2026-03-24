import React from "react";
import type { EvaluationResult } from "@/types/evaluation";
import "@/css/evaluation.css";

interface EvaluationResultsProps {
  result: EvaluationResult;
}

const EvaluationResults: React.FC<EvaluationResultsProps> = ({ result }) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "#22c55e"; // green
    if (score >= 0.6) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  const formatCriterionName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="evaluation-container">
      <div className={`recommendation-banner recommendation-${result.recommendation}`}>
        <h1 className="recommendation-header">{result.recommendation}</h1>
        <p>{result.recommendation_reason}</p>
      </div>

      <div className="score-grid">
        <div className="score-card">
          <h3 className="summary-title">Overall Score</h3>
          <div className="score-label">
            <span>Overall Evaluation</span>
            <span>{result.scores.overall_score}/100</span>
          </div>
          <div className="score-bar-container">
            <div
              className="score-bar"
              style={{
                width: `${result.scores.overall_score}%`,
                backgroundColor: getScoreColor(result.scores.overall_score / 100),
              }}
            />
          </div>
        </div>

        <div className="score-card">
          <h3 className="summary-title">Filler Word Count</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{result.filler_count}</p>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Filler words like "um", "uh", "ah" detected in candidate's speech.
          </p>
        </div>
      </div>

      <div className="score-grid">
        {Object.entries(result.scores).map(([key, value]) => {
          if (key === "overall_score") return null;
          const percentage = (value / 10) * 100;
          return (
            <div key={key} className="score-card">
              <div className="score-label">
                <span>{formatCriterionName(key)}</span>
                <span>{value}/10</span>
              </div>
              <div className="score-bar-container">
                <div
                  className="score-bar"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: getScoreColor(value / 10),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="summary-section">
        <h3 className="summary-title">Overall Summary</h3>
        <p>{result.overall_summary}</p>
      </div>

      <div className="score-grid">
        <div className="summary-section">
          <h3 className="summary-title" style={{ color: "#166534" }}>
            Strengths
          </h3>
          <p>{result.strength_summary}</p>
        </div>
        <div className="summary-section">
          <h3 className="summary-title" style={{ color: "#991b1b" }}>
            Areas for Improvement
          </h3>
          <p>{result.weakness_summary}</p>
        </div>
      </div>

      {result.red_flags.length > 0 && (
        <div className="summary-section">
          <h3 className="summary-title" style={{ color: "#e11d48" }}>
            Red Flags
          </h3>
          <ul className="red-flags-list">
            {result.red_flags.map((flag, idx) => (
              <li key={idx} className="red-flag-item">
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="summary-section">
        <h3 className="summary-title">Detailed Feedback</h3>
        <div className="detail-grid">
          {Object.entries(result.criteria_detail).map(([name, detail]) => (
            <div key={name} className="criterion-detail">
              <div className="criterion-header">
                <strong>{name}</strong>
                <span
                  style={{
                    color: getScoreColor(detail.score / 100),
                    fontWeight: "bold",
                  }}
                >
                  {detail.score}/100
                </span>
              </div>
              <p>{detail.justification}</p>
              {detail.evidence.length > 0 && (
                <div className="evidence-list">
                  <strong>Evidence:</strong>
                  {detail.evidence.map((ev, idx) => (
                    <div key={idx} className="evidence-item">
                      " {ev} "
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {result.suggested_followups.length > 0 && (
        <div className="suggested-followups">
          <h3 className="summary-title">Suggested Follow-up Questions</h3>
          <ul style={{ paddingLeft: "20px" }}>
            {result.suggested_followups.map((q, idx) => (
              <li key={idx} className="followup-item">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EvaluationResults;
