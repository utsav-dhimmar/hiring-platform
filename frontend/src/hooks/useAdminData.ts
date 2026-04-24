/**
 * Custom hook for managing data fetching and state for admin tables.
 * Provides loading, error, and data state with automatic fetch on mount.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { extractErrorMessage } from "@/utils/error";

/**
 * Options for configuring the useAdminData hook.
 * @typeParam T - The type of data being fetched
 */
interface UseAdminDataOptions<T> {
  /** Initial data to populate before fetch completes */
  initialData?: T[];
  /** Whether to automatically fetch data on component mount (default: true) */
  fetchOnMount?: boolean;
  /**
   * Set the initial loading state to true even when fetchOnMount is false.
   * Useful when the caller will trigger the first fetch manually via an effect,
   * but wants the skeleton to render immediately so child components don't
   * mount, unmount, and remount during the initial load cycle.
   */
  initialLoading?: boolean;
}

/**
 * Hook for fetching and managing admin table data.
 * @param fetchFn - Async function that returns the data array
 * @param options - Configuration options for initial data and fetch behavior
 * @returns Data state, loading state, error state, and refetch function
 * @example
 * ```ts
 * const { data, loading, error, fetchData } = useAdminData(
 *   () => fetchUsers(),
 *   { initialData: [], fetchOnMount: true }
 * );
 * ```
 */
export const useAdminData = <T>(
  fetchFn: () => Promise<T[] | { data: T[]; total: number }>,
  options: UseAdminDataOptions<T> = {},
) => {
  const { initialData = [], fetchOnMount = true, initialLoading } = options;
  const [data, setData] = useState<T[]>(initialData);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(initialLoading ?? fetchOnMount);
  const [error, setError] = useState<string | null>(null);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFnRef.current();
      // Handle both plain array and paginated response structure { data: T[], total: number }
      if (Array.isArray(result)) {
        setData(result);
        setTotal(result.length);
        return result;
      } else if (result && typeof result === "object" && Array.isArray((result as any).data)) {
        setData((result as any).data);
        setTotal(typeof (result as any).total === "number" ? (result as any).total : 0);
        return result;
      } else {
        setData([]);
        setTotal(0);
        return result;
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load data."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchOnMount]);

  return { data, setData, total, setTotal, loading, error, fetchData, setLoading, setError };
};
