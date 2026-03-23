import type { ReactElement } from "react";
import { Nav, Badge } from "react-bootstrap";
import { Card, CardBody } from "../common";
import type { JobStageConfig, StageEvaluation, Stage1Info } from "../../apis/types/stage";

/**
 * Props for the InterviewStageNav component.
 */
interface InterviewStageNavProps {
  /** The currently selected stage ID */
  activeTab: string;
  /** Callback to change the active stage */
  setActiveTab: (tab: string) => void;
  /** List of available interview stages for the job */
  jobStages: JobStageConfig[];
  /** Map of completed evaluations for each stage */
  evaluations: Record<string, StageEvaluation>;
  /** Specific information for Stage 1 (HR Screening) */
  stage1: Stage1Info | null;
}

/**
 * Navigation component for switching between different interview stages.
 * Displays stage names and their current evaluation status (Pass/Fail/Pending).
 */
const InterviewStageNav = ({
  activeTab,
  setActiveTab,
  jobStages,
  evaluations,
  stage1,
}: InterviewStageNavProps): ReactElement => {
  return (
    <Card className="mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
      <CardBody className="p-0">
        <div className="p-4 border-bottom bg-light">
          <h6 className="text-muted small text-uppercase fw-bold mb-0 letter-spacing-wide">
            Interview Stages
          </h6>
        </div>
        <Nav
          variant="pills"
          className="flex-column p-2"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || "stage0")}
        >
          <Nav.Item className="mb-1">
            <Nav.Link eventKey="stage0" className="rounded-3 border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-medium">Resume Screening</span>
                <Badge
                  bg="success"
                  className="bg-success-subtle text-success rounded-pill px-2 py-1"
                >
                  Pass
                </Badge>
              </div>
            </Nav.Link>
          </Nav.Item>

          {jobStages.map((stageConfig) => {
            const evalData = evaluations[stageConfig.id];
            const evalStatus = evalData?.status || "pending";
            const decision = evalData?.decision;
            const displayDecision =
              stageConfig.id === "config-1" ? stage1?.hr_decision : decision;
            const displayStatus = stageConfig.id === "config-1" ? stage1?.status : evalStatus;

            const isActive = activeTab === stageConfig.id;

            return (
              <Nav.Item key={stageConfig.id} className="mb-1">
                <Nav.Link
                  eventKey={stageConfig.id}
                  className={`rounded-3 border-0 py-3 ${isActive ? "shadow-sm" : ""}`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={isActive ? "fw-bold" : "fw-medium"}>
                      {stageConfig.template.name}
                    </span>
                    {displayStatus === "completed" ? (
                      <Badge
                        bg={
                          displayDecision === null
                            ? "warning"
                            : displayDecision
                            ? "success"
                            : "danger"
                        }
                        className={`rounded-pill px-2 py-1 bg-${
                          displayDecision === null
                            ? "warning"
                            : displayDecision
                            ? "success"
                            : "danger"
                        }-subtle text-${
                          displayDecision === null
                            ? "warning"
                            : displayDecision
                            ? "success"
                            : "danger"
                        }`}
                      >
                        {displayDecision === null
                          ? "Pending"
                          : displayDecision
                          ? "Pass"
                          : "Fail"}
                      </Badge>
                    ) : (
                      <Badge
                        bg="secondary"
                        className="bg-secondary-subtle text-secondary rounded-pill px-2 py-1"
                      >
                        {displayStatus === "processing" ? "Analyzing" : "Pending"}
                      </Badge>
                    )}
                  </div>
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
      </CardBody>
    </Card>
  );
};

export default InterviewStageNav;
