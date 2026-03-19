/**
 * Component for displaying formatted dates with customization options.
 * Supports various input formats, custom formatters, and fallback text.
 */

import "../../css/dateDisplay.css";

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
 * Displays a formatted date string with customizable formatting.
 * @example
 * ```tsx
 * <DateDisplay date="2024-03-15T10:30:00Z" />
 * ```
 * @example
 * ```tsx
 * <DateDisplay date={timestamp} showTime={false} fallback="No date" />
 * ```
 */
export const DateDisplay = ({
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

  try {
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
      formattedDate = showTime ? dateObj.toLocaleString() : dateObj.toLocaleDateString();
    }

    return (
      <span className={`date-display ${className}`} title={dateObj.toString()}>
        {formattedDate}
      </span>
    );
  } catch (error) {
    console.error("Error formatting date:", error);
    return <span className={`date-display error ${className}`}>{fallback}</span>;
  }
};

export default DateDisplay;
