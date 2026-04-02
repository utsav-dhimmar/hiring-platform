import type { ReactNode } from "react";

import AppPageHeader from "@/components/shared/AppPageHeader";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  breadcrumbs?: ReactNode;
  meta?: ReactNode;
  mobileMenuTrigger?: boolean;
}

const PageHeader = ({
  title,
  subtitle,
  actions,
  className = "",
  breadcrumbs,
  meta,
  mobileMenuTrigger = false,
}: PageHeaderProps) => {
  return (
    <AppPageHeader
      title={title}
      subtitle={subtitle}
      actions={actions}
      breadcrumbs={breadcrumbs}
      meta={meta}
      mobileMenuTrigger={mobileMenuTrigger}
      className={className}
      headingClassName="text-2xl sm:text-3xl"
    />
  );
};

export default PageHeader;
