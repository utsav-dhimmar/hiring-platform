import type { ReactElement } from "react";
import { Row, Col } from "react-bootstrap";
import type { JobRead } from "@/types/admin";
import {
  Card,
  CardBody,
  StatusBadge,
  SkillsBadgeList,
} from "@/components/shared";

interface JobSummaryCardProps {
  job: JobRead;
}

const JobSummaryCard = ({ job }: JobSummaryCardProps): ReactElement => {
  return (
    <Card className="mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
      <div className="bg-light px-4 py-2 border-bottom">
        <h6 className="text-muted small text-uppercase fw-bold mb-0 letter-spacing-wide">
          Job Details Context
        </h6>
      </div>
      <CardBody className="p-4">
        <Row className="g-4">
          <Col md={3} className="border-end border-light">
            <h6 className="text-muted small text-uppercase fw-bold mb-2 opacity-75">
              Department
            </h6>
            <div className="fw-bold text-dark">
              {job.department?.name ?? job.department_name ?? "General"}
            </div>
          </Col>
          <Col md={2} className="border-end border-light">
            <h6 className="text-muted small text-uppercase fw-bold mb-2 opacity-75">
              Status
            </h6>
            <StatusBadge status={job.is_active} />
          </Col>
          <Col md={3} className="border-end border-light">
            <h6 className="text-muted small text-uppercase fw-bold mb-2 opacity-75">
              Required Skills
            </h6>
            <SkillsBadgeList skills={job.skills} />
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export default JobSummaryCard;
