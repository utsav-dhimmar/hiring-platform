/**
 * Error display component with optional retry button.
 * Shows an alert message with error details and recovery options.
 */
import { Alert, Button, Container } from "react-bootstrap";

/**
 * Props for the ErrorDisplay component.
 */
interface ErrorDisplayProps {
  /** The error message to display */
  message: string;
  /** Optional callback to retry the failed operation */
  onRetry?: () => void;
  /** Whether to display as a full-page centered component (default: false) */
  fullPage?: boolean;
}

/**
 * Error alert with optional retry button.
 * @example
 * ```tsx
 * <ErrorDisplay message="Failed to load data" onRetry={refetch} />
 * <ErrorDisplay message="Error occurred" fullPage />
 * ```
 */
const ErrorDisplay = ({ message, onRetry, fullPage = false }: ErrorDisplayProps) => {
  const content = (
    <div className="py-4">
      <Alert variant="danger" className="text-center shadow-sm">
        <Alert.Heading>Error Occurred</Alert.Heading>
        <p>{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button variant="outline-danger" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        )}
      </Alert>
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

export default ErrorDisplay;
