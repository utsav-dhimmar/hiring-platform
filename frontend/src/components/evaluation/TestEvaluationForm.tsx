import React, { useState } from "react";
import { evaluationService } from "../../apis/services/evaluation";
import type { EvaluationResult } from "../../apis/types/evaluation";
import EvaluationResults from "./EvaluationResults";
import "../../css/button.css";
import "../../css/input.css";
import "../../css/card.css";

const TestEvaluationForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      setError("Please provide both a transcript file and a job description.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const evaluation = await evaluationService.testEvaluation({
        file,
        job_description: jobDescription,
        candidate_name: candidateName,
      });
      setResult(evaluation);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to run evaluation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <div className="card" style={{ marginBottom: "24px", padding: "24px" }}>
        <h2 style={{ marginBottom: "20px" }}>Test Stage 1 Evaluation</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="input-label">Transcript File (JSON/TXT)</label>
            <input
              type="file"
              className="input-field"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".json,.txt"
            />
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="input-label">Job Description</label>
            <textarea
              className="input-field"
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="input-label">Candidate Name (Optional)</label>
            <input
              type="text"
              className="input-field"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Candidate Name"
            />
          </div>

          {error && (
            <div
              style={{
                color: "#ef4444",
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#fef2f2",
                borderRadius: "6px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !file || !jobDescription}
          >
            {loading ? "Evaluating..." : "Run Evaluation"}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div className="loader"></div>
          <p style={{ marginTop: "16px", color: "#6b7280" }}>
            The LLM is judging the transcript. This may take up to a minute...
          </p>
        </div>
      )}

      {result && (
        <div className="card">
          <EvaluationResults result={result} />
        </div>
      )}
    </div>
  );
};

export default TestEvaluationForm;
