/**
 * Custom hook for managing data fetching and state for admin tables.
 * Provides loading, error, and data state with automatic fetch on mount.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { extractErrorMessage } from "../utils/error";

/**
 * Options for configuring the useAdminData hook.
 * @typeParam T - The type of data being fetched
 */
interface UseAdminDataOptions<T> {
  /** Initial data to populate before fetch completes */
  initialData?: T[];
  /** Whether to automatically fetch data on component mount (default: true) */
  fetchOnMount?: boolean;
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
  fetchFn: () => Promise<T[]>,
  options: UseAdminDataOptions<T> = {},
) => {
  const { initialData = [], fetchOnMount = true } = options;
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(fetchOnMount);
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
      setData(result);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchOnMount]);

  return { data, setData, loading, error, fetchData, setLoading, setError };
};
