import { useMemo, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { UserAdminRead } from "@/types/admin";

export const useUserTableFilters = (users: UserAdminRead[]) => {
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const minDate = useMemo(() => {
    if (users.length === 0) return new Date();
    const dates = users
      .filter((u) => u.created_at)
      .map((u) => new Date(u.created_at!).getTime());
    if (dates.length === 0) return new Date();
    return new Date(Math.min(...dates));
  }, [users]);

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.role_name) set.add(u.role_name);
    });
    return Array.from(set).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (statusFilter.length > 0) {
        const userStatus = u.is_active ? "active" : "inactive";
        if (!statusFilter.includes(userStatus)) return false;
      }

      // Role filter
      if (roleFilter.length > 0) {
        if (!roleFilter.includes(u.role_name)) return false;
      }

      // Date range filter (created_at)
      if (u.created_at && (dateRange?.from || dateRange?.to)) {
        const d = new Date(u.created_at);
        if (dateRange.from && d < startOfDay(dateRange.from)) return false;
        if (dateRange.to && d > endOfDay(dateRange.to)) return false;
      }

      return true;
    });
  }, [users, searchFilter, statusFilter, roleFilter, dateRange]);

  const hasActiveFilters =
    !!searchFilter ||
    statusFilter.length > 0 ||
    roleFilter.length > 0 ||
    !!dateRange?.from ||
    !!dateRange?.to;

  const clearFilters = () => {
    setSearchFilter("");
    setStatusFilter([]);
    setRoleFilter([]);
    setDateRange({ from: undefined, to: undefined });
  };

  return {
    searchFilter,
    setSearchFilter,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    dateRange,
    setDateRange,
    roleOptions,
    filteredUsers,
    hasActiveFilters,
    clearFilters,
    minDate,
  };
};
