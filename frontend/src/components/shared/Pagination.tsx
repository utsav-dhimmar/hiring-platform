import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  dataLength: number;
}

const Pagination = ({ page, pageSize, total, onPageChange, dataLength }: PaginationProps) => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Scroll to top of content area on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const current = page || 1;

  return (
    <div className="flex items-center justify-between border-t px-2 pt-3 mt-3">
      <div className="text-sm text-muted-foreground">
        Showing {dataLength > 0 ? (current - 1) * pageSize + 1 : 0} to{" "}
        {Math.min(current * pageSize, total)} of {total} entries
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
        >
          Previous
        </Button>

        {[...Array(totalPages)].map((_, i) => {
          const p = i + 1;
          if (p === 1 || p === totalPages || (p >= current - 1 && p <= current + 1)) {
            return (
              <Button
                key={p}
                variant={current === p ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            );
          }
          if (p === current - 2 || p === current + 2) {
            return (
              <span key={p} className="px-2 text-muted-foreground">
                ...
              </span>
            );
          }
          return null;
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
