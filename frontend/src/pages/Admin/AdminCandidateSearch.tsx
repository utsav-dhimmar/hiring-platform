/**
 * Admin page for searching candidates globally or for a specific job.
 * Provides advanced search and filtering for HR.
 */

import { useCallback, useEffect, useState } from "react";
import { Badge } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { adminCandidateService, adminJobService } from "../../apis/admin/service";
import type { JobRead } from "../../apis/admin/types";
import type { CandidateResponse } from "../../apis/types/resume";
import {
  AdminDataTable,
  Button,
  Card,
  CardBody,
  type Column,
  DateDisplay,
  ErrorDisplay,
  PageHeader,
  SearchBar,
  StatusBadge,
  SkillsBadgeList,
  StagesBadgeList,
} from "../../components/common";
import { CandidateDetailModal } from "../../components/modal";

import "../../css/adminDashboard.css";

const AdminCandidateSearch = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
  const [job, setJob] = useState<JobRead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResponse | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: CandidateResponse[] = [];
      if (jobId) {
        if (searchQuery.trim()) {
          data = await adminCandidateService.searchJobCandidates(jobId, searchQuery);
        } else {
          data = await adminCandidateService.getCandidatesForJob(jobId);
        }
      } else if (searchQuery.trim()) {
        data = await adminCandidateService.searchCandidates(searchQuery);
      }
      setCandidates(data);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }, [jobId, searchQuery]);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const jobData = await adminJobService.getJobById(jobId);
      setJob(jobData);
    } catch (err) {
      console.error("Failed to fetch job info:", err);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
    fetchCandidates();
  }, [jobId, fetchCandidates, fetchJob]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  const handleShowMore = (candidate: CandidateResponse) => {
    setSelectedCandidate(candidate);
    setShowDetail(true);
  };

  const columns: Column<CandidateResponse>[] = [
    {
      header: "Name",
      accessor: (c) => `${c.first_name} ${c.last_name}`,
    },
    { header: "Email", accessor: "email" },
    {
      header: "Score",
      accessor: (c) =>
        c.resume_score !== null ? (
          <Badge bg={c.resume_score >= 65 ? "success" : "warning"}>
            {c.resume_score.toFixed(1)}%
          </Badge>
        ) : (
          <span className="text-muted">N/A</span>
        ),
    },
    {
      header: "Result",
      accessor: (c) => (
        <StatusBadge
          status={c.pass_fail === null ? "pending" : c.pass_fail ? "pass" : "fail"}
          mapping={{
            pass: "success",
            fail: "danger",
            pending: "secondary",
          }}
        />
      ),
    },
    {
      header: "Applied At",
      accessor: (c) => <DateDisplay date={c.created_at} showTime={false} />,
    },
    {
      header: "Actions",
      accessor: (c) => (
        <Button variant="outline-primary" size="sm" onClick={() => handleShowMore(c)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="admin-dashboard">
      <PageHeader
        title={jobId ? `Candidates for ${job?.title || "Job"}` : "Global Candidate Search"}
        actions={
          jobId && (
            <Button variant="outline-secondary" onClick={() => navigate("/admin/jobs")}>
              Back to Jobs
            </Button>
          )
        }
      />

      {job && (
        <Card className="mb-4 bg-light border-0 shadow-sm">
          <CardBody className="p-4">
            <div className="row g-4">
              <div className="col-md-3 border-end">
                <h6 className="text-muted small text-uppercase fw-bold mb-2">Department</h6>
                <div className="fs-5">{job.department || "N/A"}</div>
              </div>
              <div className="col-md-2 border-end">
                <h6 className="text-muted small text-uppercase fw-bold mb-2">Status</h6>
                <StatusBadge status={job.is_active} />
              </div>
              <div className="col-md-3 border-end">
                <h6 className="text-muted small text-uppercase fw-bold mb-2">Required Skills</h6>
                <SkillsBadgeList skills={job.skills} />
              </div>
              <div className="col-md-4">
                <h6 className="text-muted small text-uppercase fw-bold mb-2">Hiring Pipeline</h6>
                <StagesBadgeList stages={job.stages} />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mb-4">
        <CardBody>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            isLoading={loading}
            placeholder="Search by name or email..."
          />
        </CardBody>
      </Card>

      {error && <ErrorDisplay message={error} onRetry={fetchCandidates} />}

      <AdminDataTable
        columns={columns}
        data={candidates}
        loading={loading && candidates.length === 0}
        error={null} // Handled above
        onRetry={fetchCandidates}
        rowKey="id"
        emptyMessage={
          searchQuery ? "No candidates found matching your search." : "No candidates found."
        }
      />

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        candidate={selectedCandidate}
      />
    </div>
  );
};

export default AdminCandidateSearch;
