import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ErrorDisplay } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminJobService } from "@/apis/admin/service";
import type { JobResumeInfoResponse } from "@/types/resume";
import { extractErrorMessage } from "@/utils/error";

interface ResumeScreeningDetailModalProps {
  show: boolean;
  onHide: () => void;
  jobId: string | undefined;
  resumeId: string | null;
}

const ResumeScreeningDetailModal = ({
  show,
  onHide,
  jobId,
  resumeId,
}: ResumeScreeningDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JobResumeInfoResponse | null>(null);

  const fetchData = useCallback(async () => {
    if (!jobId || !resumeId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await adminJobService.getJobResumeDetail(jobId, resumeId);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch resume screening details:", err);
      setError(extractErrorMessage(err, "Failed to load screening details."));
    } finally {
      setLoading(false);
    }
  }, [jobId, resumeId]);

  useEffect(() => {
    if (show && jobId && resumeId) {
      fetchData();
    } else if (!show) {
      setData(null);
      setError(null);
    }
  }, [show, jobId, resumeId, fetchData]);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-0 pb-0">
          <DialogTitle className="font-bold">
            Detailed Screening: {data?.candidate_first_name} {data?.candidate_last_name}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-3">
          {loading && (
            <div className="text-center py-5">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading screening details...</p>
            </div>
          )}

          {error && <ErrorDisplay message={error} onRetry={fetchData} />}

          {!loading && !error && data && (
            <div className="resume-details">
              <div className="flex justify-between items-center mb-4 p-3 bg-muted rounded-lg border">
                <div>
                  <div className="text-muted-foreground text-sm mb-1">Status</div>
                  <Badge
                    variant={
                      data.pass_fail && (data.resume_score ?? 0) >= 65
                        ? "default"
                        : data.pass_fail === false || (data.resume_score ?? 0) < 65
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {data.pass_fail === true && (data.resume_score ?? 0) >= 65
                      ? "PASS"
                      : data.pass_fail === false || (data.resume_score ?? 0) < 65
                        ? "FAIL"
                        : "PENDING"}
                  </Badge>
                </div>
                <div className="text-end">
                  <div className="text-muted-foreground text-sm mb-1">Score</div>
                  <div
                    className={`text-2xl font-bold ${data.resume_score && data.resume_score >= 80 ? "text-green-500" : data.resume_score && data.resume_score >= 65 ? "text-yellow-500" : "text-red-500"}`}
                  >
                    {data.resume_score !== null ? `${data.resume_score.toFixed(1)}%` : "N/A"}
                  </div>
                </div>
              </div>

              {data.analysis && (
                <section className="mb-4">
                  <h5 className="font-bold mb-3 flex items-center gap-2">
                    <span className="bg-primary/10 p-1 rounded text-primary">🤖</span>
                    AI Match Analysis
                  </h5>
                  <Card className="border-0 shadow-sm mb-3">
                    <div className="p-3">
                      <h6 className="font-bold text-sm uppercase text-muted-foreground mb-2">
                        Strength Summary
                      </h6>
                      <p className="mb-0 text-foreground" style={{ lineHeight: "1.6" }}>
                        {data.analysis.strength_summary}
                      </p>
                    </div>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <div className="p-3">
                      <h6 className="font-bold text-sm uppercase text-muted-foreground mb-2">
                        Experience Alignment
                      </h6>
                      <p className="mb-0 text-foreground" style={{ lineHeight: "1.6" }}>
                        {data.analysis.experience_alignment}
                      </p>
                    </div>
                  </Card>
                </section>
              )}

              <section className="mb-4">
                <h5 className="font-bold mb-3 flex items-center gap-2">
                  <span className="bg-secondary/20 p-1 rounded text-secondary">📋</span>
                  Resume Metadata
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="h-100 border-0 shadow-sm p-3">
                    <div className="text-sm text-muted-foreground mb-1">File Name</div>
                    <div className="font-medium truncate" title={data.file_name}>
                      {data.file_name}
                    </div>
                  </Card>
                  <Card className="h-100 border-0 shadow-sm p-3">
                    <div className="text-sm text-muted-foreground mb-1">Uploaded At</div>
                    <div className="font-medium">{new Date(data.uploaded_at).toLocaleString()}</div>
                  </Card>
                </div>
              </section>
            </div>
          )}
        </div>
        <DialogFooter className="border-t-0 pt-0">
          <Button variant="outline" onClick={onHide}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeScreeningDetailModal;
