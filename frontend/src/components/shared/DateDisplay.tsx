/**
 * Component for displaying formatted dates with customization options.
 * Supports various input formats, custom formatters, and fallback text.
 */

import "@/css/dateDisplay.css";

import ErrorBoundary from "@/components/shared/ErrorBoundary";

/**
 * Props for the DateDisplay component.
 */
interface DateDisplayProps {
  /** Date value to display (string, number, or Date object) */
  date: string | number | Date | null | undefined;
  /** Whether to show time along with date (default: true) */
  showTime?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Fallback text to display when date is invalid or null (default: 'N/A') */
  fallback?: string;
  /** Custom Intl.DateTimeFormat options for formatting */
  formatOptions?: Intl.DateTimeFormatOptions;
  /** Custom formatter function to convert Date to string */
  formatter?: (date: Date) => string;
}

/**
 * Internal component for rendering the formatted date.
 * Relies on ErrorBoundary for catching unexpected formatting errors.
 */
const DateDisplayContent = ({
  date,
  showTime = true,
  className = "",
  fallback = "N/A",
  formatOptions,
  formatter,
}: DateDisplayProps) => {
  if (!date) {
    return <span className={`date-display fallback ${className}`}>{fallback}</span>;
  }

  const dateObj = new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return <span className={`date-display invalid ${className}`}>{fallback}</span>;
  }

  let formattedDate = "";
  if (formatter) {
    formattedDate = formatter(dateObj);
  } else if (formatOptions) {
    formattedDate = dateObj.toLocaleString(undefined, formatOptions);
  } else {
    formattedDate = showTime ? dateObj.toLocaleString() : dateObj.toLocaleDateString("en-GB");
  }

  return (
    <span className={`date-display ${className}`} title={dateObj.toString()}>
      {formattedDate}
    </span>
  );
};

/**
 * Displays a formatted date string with customizable formatting.
 * Wrapped in an ErrorBoundary to catch rendering/formatting errors.
 *
 * @example
 * ```tsx
 * <DateDisplay date="2024-03-15T10:30:00Z" />
 * ```
 */
export const DateDisplay = (props: DateDisplayProps) => {
  const { className = "", fallback = "N/A" } = props;

  const errorFallback = <span className={`date-display error ${className}`}>{fallback}</span>;

  return (
    <ErrorBoundary fallback={errorFallback}>
      <DateDisplayContent {...props} />
    </ErrorBoundary>
  );
};

export default DateDisplay;
