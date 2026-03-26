/**
 * Error display component with optional retry button.
 * Shows an alert message with error details and recovery options.
 */

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/shared";

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
 */
const ErrorDisplay = ({ message, onRetry, fullPage = false }: ErrorDisplayProps) => {
  const content = (
    <div className="py-4">
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center shadow-sm">
        <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
        <h4 className="font-semibold text-destructive">Error Occurred</h4>
        <p className="text-muted-foreground">{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default ErrorDisplay;
