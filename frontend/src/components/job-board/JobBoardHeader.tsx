import { Button } from "@/components/";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { AppPageHeader } from "@/components/shared";
import { useNavigate } from "react-router-dom";

/**
 * Page header for the Job Board, displaying the title, breadcrumbs, and a
 * "Create Job" button that navigates to `/dashboard/jobs/new`.
 */
export const JobBoardHeader = () => {
  const navigate = useNavigate();

  return (
    <AppPageHeader
      title="Job Board"
      breadcrumbs={<DashboardBreadcrumbs />}
      actions={
        <Button
          className="rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
          onClick={() => navigate("/dashboard/jobs/new")}
        >
          Create Job
        </Button>
      }
    />
  );
};
