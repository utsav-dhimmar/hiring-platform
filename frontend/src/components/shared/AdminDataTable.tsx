/**
 * Reusable data table component for admin interfaces.
 * Displays tabular data with loading, error, and empty states.
 */

import React, { type ReactNode } from "react";
import { Card, CardBody, ErrorDisplay, Pagination } from "@/components/shared";

import { TableRowSkeleton } from "@/components/shared";


/**
 * Column definition for AdminDataTable.
 * @typeParam T - The data type being displayed
 */
export interface Column<T> {
  /** Column header text */
  header: string;
  /** Property name or function to get cell value */
  accessor: keyof T | ((item: T) => ReactNode);
  /** Optional CSS class for the column cells */
  className?: string;
  /** Optional inline styles for the column */
  style?: React.CSSProperties;
}

/**
 * Props for the AdminDataTable component.
 * @typeParam T - The data type being displayed in the table
 */
interface AdminDataTableProps<T> {
  /** Column definitions for the table */
  columns: Column<T>[];
  /** Data items to display */
  data: T[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Error message to display if fetch failed */
  error?: string | null;
  /** Callback to retry failed data fetch */
  onRetry?: () => void;
  /** Message to display when no data is available */
  emptyMessage?: string;
  /** Property name or function to get unique row key */
  rowKey: keyof T | ((item: T) => string | number);
  /** Additional CSS class for the card wrapper */
  className?: string;
  /** Additional CSS class for the table element */
  tableClassName?: string;
  /** Current page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total number of items (for pagination) */
  total?: number;
  /** Callback when page is changed */
  onPageChange?: (page: number) => void;
}

/**
 * Admin data table with sorting, loading, error, and empty states.
 * @example
 * ```tsx
 * <AdminDataTable
 *   columns={[
 *     { header: 'Name', accessor: 'name' },
 *     { header: 'Email', accessor: user => user.email }
 *   ]}
 *   data={users}
 *   rowKey="id"
 *   loading={isLoading}
 * />
 * ```
 */
function AdminDataTable<T>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = "No items found.",
  rowKey,
  className = "",
  tableClassName = "table w-100 admin-table",
  page,
  pageSize = 10,
  total,
  onPageChange,
}: AdminDataTableProps<T>) {
  // If error and no data, show full ErrorDisplay
  if (error && data.length === 0) {
    return <ErrorDisplay message={error} onRetry={onRetry} />;
  }

  const getRowKey = (item: T): string | number => {
    if (typeof rowKey === "function") {
      return rowKey(item);
    }
    return item[rowKey] as unknown as string | number;
  };

  return (
    <Card className={`${className}`}>
      <CardBody>
        {/* If error and data exists, show a smaller alert above the table */}
        {error && data.length > 0 && (
          <div className="mb-3">
            <ErrorDisplay message={error} onRetry={onRetry} />
          </div>
        )}
        <div className="table-responsive">
          <table className={tableClassName}>
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className={column.className} style={column.style}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Use skeletons if loading
                [...Array(pageSize)].map((_, i) => (
                  <TableRowSkeleton key={i} columns={columns.length} />
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-5">
                    <div className="py-4 text-muted">
                      <h5 className="fw-bold">{emptyMessage}</h5>
                      <p>Try different filters or add new entries.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={getRowKey(item)}>
                    {columns.map((column, index) => (
                      <td key={index} className={column.className} style={column.style}>
                        {typeof column.accessor === "function"
                          ? column.accessor(item)
                          : (item[column.accessor] as ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total !== undefined && onPageChange && (
          <Pagination
            page={page || 1}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            dataLength={data.length}
          />
        )}
      </CardBody>
    </Card>
  );
}

export default AdminDataTable;
