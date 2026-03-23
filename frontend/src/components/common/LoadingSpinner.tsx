/**
 * Loading spinner component with optional message.
 * Displays a centered loading indicator during async operations.
 */

import { Spinner, Container } from "react-bootstrap";

/**
 * Props for the LoadingSpinner component.
 */
interface LoadingSpinnerProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Whether to display as a full-page centered component (default: false) */
  fullPage?: boolean;
}

/**
 * Loading spinner with optional message.
 * @example
 * ```tsx
 * <LoadingSpinner message="Loading users..." />
 * <LoadingSpinner fullPage />
 * ```
 */
const LoadingSpinner = ({
  message = "Loading...",
  fullPage = false,
}: LoadingSpinnerProps) => {
  const content = (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      {message && <p className="mt-3 text-muted">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "80vh" }}
      >
        {content}
      </Container>
    );
  }

  return content;
};

export default LoadingSpinner;
