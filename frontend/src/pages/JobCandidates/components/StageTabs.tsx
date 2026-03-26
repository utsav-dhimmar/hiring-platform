type Stage = "resume-screening";

interface StageTabsProps {
  activeStage: Stage;
  onStageChange: (stage: Stage) => void;
}

const StageTabs = ({ activeStage, onStageChange }: StageTabsProps) => {
  return (
    <div className="mb-4">
      <div className="bg-white p-2 rounded-lg shadow-sm border border-border flex gap-2">
        <button
          onClick={() => onStageChange("resume-screening")}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeStage === "resume-screening"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Resume Screening
        </button>
      </div>
    </div>
  );
};

export default StageTabs;
