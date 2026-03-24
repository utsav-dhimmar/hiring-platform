import TestEvaluationForm from "@/components/evaluation/TestEvaluationForm";

const TestEvaluationPage = () => {
  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ marginBottom: "24px" }}>Evaluation Lab</h1>
      <p style={{ marginBottom: "32px", color: "#6b7280" }}>
        Test the Stage 1 LLM Evaluation engine by uploading a transcript file and providing a job
        description.
      </p>
      <TestEvaluationForm />
    </div>
  );
};

export default TestEvaluationPage;
