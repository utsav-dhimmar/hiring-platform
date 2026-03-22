/**
 * Search bar component with input field and submit button.
 * Provides a reusable search interface for filtering data.
 */

import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { Input, Button } from "./index";

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
 * @example
 * ```tsx
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onSearch={handleSearch}
 *   placeholder="Search users..."
 * />
 * ```
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
    <Form onSubmit={onSearch} className={className}>
      <Row className="g-2">
        <Col>
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </Col>
        <Col xs="auto">
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Search
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default SearchBar;
