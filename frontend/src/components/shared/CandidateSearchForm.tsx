import type { ReactElement, SyntheticEvent } from "react";
import SearchBar from "@/components/shared/SearchBar";

interface CandidateSearchFormProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: SyntheticEvent) => void;
  loading: boolean;
  placeholder?: string;
}

const CandidateSearchForm = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  loading,
  placeholder = "Search candidates by name or email...",
}: CandidateSearchFormProps): ReactElement => {
  return (
    <div className="">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        isLoading={loading}
        placeholder={placeholder}
      />
    </div>

  );
};

export default CandidateSearchForm;
