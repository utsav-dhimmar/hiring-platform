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
 * @example
 * ```tsx
 * <PageHeader
 *   title="User Management"
 *   subtitle="Manage system users and permissions"
 *   actions={<Button>Add User</Button>}
 * />
 * ```
 */
const PageHeader = ({ title, subtitle, actions, className = "" }: PageHeaderProps) => {
  return (
    <div className={`d-flex justify-content-between align-items-center mb-4 ${className}`}>
      <div>
        <h1 className="h2 mb-1">{title}</h1>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
