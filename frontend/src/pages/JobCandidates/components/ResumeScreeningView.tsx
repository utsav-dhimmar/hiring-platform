import { Card, CandidateSearchForm } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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

      <Card>
        <div className="flex justify-between items-center p-4 pb-0">
          <h3 className="mb-0">
            {searchQuery ? "Search Results" : "Applicant List"}
          </h3>
          <Badge variant="secondary">{candidates.length} Candidate Found</Badge>
        </div>
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
          onShowScreeningDetails={() => {}}
          showEvaluateAction={true}
          jobId={jobId}
        />
      </Card>
    </>
  );
};

export default ResumeScreeningView;
