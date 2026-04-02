import { Button } from "@/components/";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { useNavigate } from "react-router-dom";

/**
 * Page header for the Job Board, displaying the title, breadcrumbs, and a
 * "Create Job" button that navigates to `/dashboard/jobs/new`.
 */
export const JobBoardHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Job Board</h1>
        <DashboardBreadcrumbs />
      </div>
      <Button
        className="rounded-xl px-4 py-3 text-md font-semibold bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300"
        onClick={() => navigate("/dashboard/jobs/new")}
      >
        Create Job
      </Button>
    </div>
  );
};
