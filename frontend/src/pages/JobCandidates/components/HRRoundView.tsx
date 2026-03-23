import { Row, Col, Badge } from "react-bootstrap";
import { Card, CardHeader } from "@/components/shared";
import HRRoundTable from "@/components/candidate/HRRoundTable";
import type { HRRoundResult } from "@/types/admin";

interface HRRoundViewProps {
  hrResults: HRRoundResult[];
  hrLoading: boolean;
  hrError: string | null;
  fetchHRResults: () => void;
  jobId: string | undefined;
}

const HRRoundView = ({
  hrResults,
  hrLoading,
  hrError,
  fetchHRResults,
  jobId,
}: HRRoundViewProps) => {
  return (
    <Row>
      <Col>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">HR Screening Results</h3>
            <Badge bg="primary">{hrResults.length} Interviews Found</Badge>
          </CardHeader>
          <HRRoundTable
            results={hrResults}
            loading={hrLoading}
            error={hrError}
            onRetry={fetchHRResults}
            jobId={jobId}
            className="border-0 shadow-none"
          />
        </Card>
      </Col>
    </Row>
  );
};

export default HRRoundView;
