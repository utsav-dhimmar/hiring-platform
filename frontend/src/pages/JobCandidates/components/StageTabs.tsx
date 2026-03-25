import { Nav } from "react-bootstrap";

type Stage = "resume-screening";

interface StageTabsProps {
  activeStage: Stage;
  onStageChange: (stage: Stage) => void;
}

const StageTabs = ({ activeStage, onStageChange }: StageTabsProps) => {
  return (
    <div className="mb-4">
      <Nav
        variant="pills"
        className="bg-white p-2 rounded-3 shadow-sm border border-light"
      >
        <Nav.Item>
          <Nav.Link
            active={activeStage === "resume-screening"}
            onClick={() => onStageChange("resume-screening")}
            className="rounded-2 px-4 py-2"
          >
            Resume Screening
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default StageTabs;
