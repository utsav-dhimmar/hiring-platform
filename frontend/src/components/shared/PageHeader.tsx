/**
 * Page header component with title, optional subtitle, and action buttons.
 * Used as a consistent header across application pages.
 */

import { type ReactNode } from "react";

/**
 * Props for the PageHeader component.
 */
interface PageHeaderProps {
  /** Main title of the page */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Optional action buttons or content to display on the right */
  actions?: ReactNode;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Page header with title, subtitle, and optional actions.
 */
const PageHeader = ({ title, subtitle, actions, className = "" }: PageHeaderProps) => {
  return (
    <div className={`flex justify-between items-center mb-2 ${className}`}>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
