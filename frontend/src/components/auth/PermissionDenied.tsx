interface PermissionDeniedProps {
  message?: string;
}

const DEFAULT_MESSAGE = "You don't have enough permission to see this resource";

const PermissionDenied = ({ message = DEFAULT_MESSAGE }: PermissionDeniedProps) => {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <p className="max-w-md text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
};

export default PermissionDenied;
