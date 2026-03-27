/**
 * Loading spinner component with optional message.
 * Displays a centered loading indicator during async operations.
 */

import { Loader2 } from "lucide-react";

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
 */
const LoadingSpinner = ({ message = "Loading...", fullPage = false }: LoadingSpinnerProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-5">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="mt-3 text-muted-foreground">{message}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="flex min-h-[80vh] items-center justify-center">{content}</div>;
  }

  return content;
};

export default LoadingSpinner;
