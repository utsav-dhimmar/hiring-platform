/**
 * Job search component for filtering available job postings.
 * Provides a search interface for querying jobs by title and description.
 */

import React, { useState } from "react";
import jobService from "@/apis/job";
import type { Job } from "@/types/job";
import SearchBar from "@/components/shared/SearchBar";
import { extractErrorMessage } from "@/utils/error";

/**
 * Props for the JobSearch component.
 */
interface JobSearchProps {
  /** Callback when search results are returned */
  onResultsFound: (jobs: Job[]) => void;
  /** Callback when search query is cleared */
  onClear: () => void;
  /** Callback when an error occurs during search */
  onError: (message: string) => void;
  /** Whether search is in progress */
  onSearching: (searching: boolean) => void;
}

/**
 * Job search component with input field and search logic.
 * Encapsulates the job search functionality for reusability.
 */
const JobSearch = ({ onResultsFound, onClear, onError, onSearching }: JobSearchProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the search form submission.
   * Calls the job service to search for matching jobs.
   */
  const handleSearch = async (e: React.SyntheticEvent) => {
    if (e) e.preventDefault();

    if (!query.trim()) {
      onClear();
      return;
    }

    setIsLoading(true);
    onSearching(true);
    try {
      const results = await jobService.searchJobs(query);
      onResultsFound(results.data);
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      console.error(errorMessage || "Failed to search jobs:", error);
      onError("Failed to search jobs. Please try again.");
    } finally {
      setIsLoading(false);
      onSearching(false);
    }
  };

  /**
   * Handles input changes and clears results if input is emptied.
   */
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      onClear();
    }
  };

  return (
    <SearchBar
      placeholder="Search jobs by title or description..."
      value={query}
      onChange={handleQueryChange}
      onSearch={handleSearch}
      isLoading={isLoading}
    />
  );
};

export default JobSearch;
