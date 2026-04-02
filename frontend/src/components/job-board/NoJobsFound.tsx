import { Users } from "lucide-react";

/**
 * Empty-state illustration shown when the employer has no job postings yet.
 * Displays a prompt encouraging the user to create their first job.
 */
export const NoJobsFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
      <div className="p-4 bg-muted rounded-full">
        <Users className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <h3 className="text-lg font-medium">No jobs found</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Get started by creating your first job posting.
      </p>
    </div>
  );
};
