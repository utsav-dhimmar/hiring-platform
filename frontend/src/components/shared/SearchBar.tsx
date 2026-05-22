/**
 * Search bar component with input field and submit button.
 * Provides a reusable search interface for filtering data.
 */

import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

/**
 * Props for the SearchBar component.
 */
interface SearchBarProps {
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Current search value */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Callback when search form is submitted */
  onSearch: (e: React.SyntheticEvent) => void;
  /** Whether to show loading state on the search button */
  isLoading?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Search bar with input field and submit button.
 */
const SearchBar = ({
  placeholder = "Search...",
  value,
  onChange,
  onSearch,
  isLoading = false,
  className = "",
}: SearchBarProps) => {
  return (
    <form onSubmit={onSearch} className={className}>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" isLoading={isLoading}>
          Search
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
