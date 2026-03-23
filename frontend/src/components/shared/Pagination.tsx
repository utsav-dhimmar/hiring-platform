interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  dataLength: number;
}

const Pagination = ({ page, pageSize, total, onPageChange, dataLength }: PaginationProps) => {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const current = page || 1;

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3 px-2">
      <div className="text-muted small">
        Showing {dataLength > 0 ? (current - 1) * pageSize + 1 : 0} to{" "}
        {Math.min(current * pageSize, total)} of {total} entries
      </div>
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item ${current === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(current - 1)}
            disabled={current === 1}
          >
            Previous
          </button>
        </li>

        {[...Array(totalPages)].map((_, i) => {
          const p = i + 1;
          // Only show a few pages around current to prevent huge lists
          if (p === 1 || p === totalPages || (p >= current - 1 && p <= current + 1)) {
            return (
              <li key={p} className={`page-item ${current === p ? "active" : ""}`}>
                <button className="page-link" onClick={() => onPageChange(p)}>
                  {p}
                </button>
              </li>
            );
          }
          if (p === current - 2 || p === current + 2) {
            return (
              <li key={p} className="page-item disabled">
                <span className="page-link">...</span>
              </li>
            );
          }
          return null;
        })}

        <li className={`page-item ${current === totalPages ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(current + 1)}
            disabled={current === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Pagination;
