import { Row, Col, Badge } from "react-bootstrap";
import { Card, CardHeader, CandidateSearchForm } from "@/components/shared";
import CandidateTable from "@/components/candidate/CandidateTable";
import type { CandidateResponse } from "@/types/resume";

interface ResumeScreeningViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.SyntheticEvent) => void;
  isSearching: boolean;
  candidates: CandidateResponse[];
  loading: boolean;
  error: string | null;
  fetchData: () => void;
  onShowMore: (candidate: CandidateResponse) => void;
  onShowScreeningDetails: (candidate: CandidateResponse) => void;
  jobId: string | undefined;
}

const ResumeScreeningView = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearching,
  candidates,
  loading,
  error,
  fetchData,
  onShowMore,
  onShowScreeningDetails,
  jobId,
}: ResumeScreeningViewProps) => {
  return (
    <>
      <CandidateSearchForm
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        loading={isSearching}
        placeholder="Search candidates for this job by name or email..."
      />

      <Row>
        <Col>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">
                {searchQuery ? "Search Results" : "Applicant List"}
              </h3>
              <Badge bg="primary">{candidates.length} Candidate Found</Badge>
            </CardHeader>
            <CandidateTable
              candidates={candidates}
              loading={loading || (isSearching && candidates.length === 0)}
              error={error}
              onRetry={fetchData}
              className="border-0 shadow-none"
              emptyMessage={
                searchQuery
                  ? `No candidates found matching with "${searchQuery}"`
                  : "No candidates have applied for this job yet."
              }
              onShowMore={onShowMore}
              onShowScreeningDetails={onShowScreeningDetails}
              showEvaluateAction={true}
              jobId={jobId}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ResumeScreeningView;
