/**
 * Home page displaying available jobs and resume upload functionality.
 * Allows users to browse open positions and submit resumes.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import jobService from "@/apis/job";
import { resumeService } from "@/apis/resume";
import type { Job } from "@/types/job";
import {
  Card,
  JobSearch,
  TableRowSkeleton,
  useToast,
} from "@/components/shared";
import { Button } from "@/components/index"
import { extractErrorMessage } from "@/utils/error";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { authService } from "@/apis/auth";

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  const goToAdmin = () => {
    navigate("/admin");
  };

  const viewCandidates = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobService.getJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      const errorMessage = extractErrorMessage(error, "Failed to load jobs.");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleJobsFound = (results: Job[]) => {
    setJobs(results);
  };

  const handleClearSearch = () => {
    fetchJobs();
  };

  const handleSearchError = (errorMsg: string) => {
    toast.error(errorMsg);
  };

  const handleFileUpload = async (
    jobId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_MB = Number(import.meta.env.VITE_RESUME_MAX_SIZE_MB) || 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.warn(`Resume size must be <= ${MAX_SIZE_MB} MB.`);
      event.target.value = "";
      return;
    }

    setUploading((prev) => ({ ...prev, [jobId]: true }));

    try {
      await resumeService.uploadResume(jobId, file);
      toast.success("Resume uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = extractErrorMessage(
        error,
        "Failed to upload resume.",
      );
      toast.error(errorMessage);
    } finally {
      setUploading((prev) => ({ ...prev, [jobId]: false }));
      event.target.value = "";
    }
  };

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold mb-0">Active Job Openings</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={goToAdmin}>
            Panel
          </Button>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-white border-0 pt-4 px-4">
          <div className="flex justify-between items-center">
            <h4 className="mb-0 font-bold">Job Postings</h4>
            <div className="text-muted-foreground text-sm">
              {loading ? "Counting..." : `${jobs.length} Positions`}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-4 relative">
            <JobSearch
              onResultsFound={handleJobsFound}
              onClear={handleClearSearch}
              onError={handleSearchError}
              onSearching={setSearchingJobs}
            />
            {searchingJobs && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted text-muted-foreground text-sm uppercase font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">Job Title</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRowSkeleton key={i} columns={4} />
                  ))
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <div className="py-4">
                        <h5 className="font-bold">No jobs found</h5>
                        <p className="text-muted-foreground">
                          Try adjusting your search or check back later.
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleClearSearch}
                        >
                          Clear Search
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border">
                      <td className="px-4 py-3">
                        <div className="font-semibold">
                          {job.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {job.department?.name ??
                          job.department_name ??
                          "General"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            job.is_active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {job.is_active ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {uploading[job.id] ? (
                            <div className="flex items-center gap-2 text-primary text-sm font-medium px-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                className="hidden"
                                id={`file-input-${job.id}`}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => handleFileUpload(job.id, e)}
                                accept=".pdf,.doc,.docx"
                              />
                              <label
                                htmlFor={`file-input-${job.id}`}
                                className="px-3 py-1.5 text-sm border border-primary text-primary rounded hover:bg-primary/10 cursor-pointer"
                              >
                                Upload Resume
                              </label>
                              <Button
                                onClick={() => viewCandidates(job.id)}
                                size="sm"
                              >
                                Candidates
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HomePage;
