/**
 * Props for the PermissionDenied component.
 */
interface PermissionDeniedProps {
  /** Custom message to display. Defaults to "You don't have enough permission to see this resource" */
  message?: string;
}

const DEFAULT_MESSAGE = "You don't have enough permission to see this resource";

/**
 * A component that displays an access denied message when a user lacks required permissions.
 * Shows a centered, styled message with a dashed border container.
 * @example
 * ```tsx
 * <PermissionDenied />
 * 
 * <PermissionDenied message="You need admin access to view this page" />
 * ```
 */
const PermissionDenied = ({ message = DEFAULT_MESSAGE }: PermissionDeniedProps) => {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <p className="max-w-md text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
};

export default PermissionDenied;
