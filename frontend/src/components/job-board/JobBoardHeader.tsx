import { Button } from "@/components/";
import { AppPageHeader } from "@/components/shared";
import { useNavigate } from "react-router-dom";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Page header for the Job Board, displaying the title, breadcrumbs, and a
 * "Create Job" button that navigates to `/dashboard/jobs/new`.
 */
export const JobBoardHeader = () => {
  const navigate = useNavigate();

  return (
    <AppPageHeader
      title="Job Board"
      actions={
        <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
          <Button
            className="rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
            onClick={() => navigate("/dashboard/jobs/new")}
          >
            Create Job
          </Button>
        </PermissionGuard>
      }
    />
  );
};
