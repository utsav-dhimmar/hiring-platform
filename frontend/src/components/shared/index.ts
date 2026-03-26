/**
 * Common UI components barrel export.
 * Re-exports DateDisplay, Button, Input, and Card components with their variants.
 */

export { DateDisplay, default as DateDisplayDefault } from "@/components/shared/DateDisplay";
export { Button, default as ButtonDefault } from "@/components/shared/Button";
export { Input, default as InputDefault } from "@/components/shared/Input";
export { Card, CardHeader, CardBody, CardFooter, default as CardDefault } from "@/components/shared/Card";
export { default as DeleteModal } from "@/components/modal/DeleteModal";
export { default as LoadingSpinner } from "@/components/shared/LoadingSpinner";
export { default as ErrorDisplay } from "@/components/shared/ErrorDisplay";
export { default as PageHeader } from "@/components/shared/PageHeader";
export { default as StatusBadge } from "@/components/shared/StatusBadge";
export { default as ErrorBoundary } from "@/components/shared/ErrorBoundary";
export { default as AdminDataTable, type Column } from "@/components/shared/AdminDataTable";
export { default as Pagination } from "@/components/shared/Pagination";
export { default as SearchBar } from "@/components/shared/SearchBar";
export { default as JobSearch } from "@/components/shared/JobSearch";
export { default as StagesBadgeList } from "@/components/shared/StagesBadgeList";
export { default as SkillsBadgeList } from "@/components/shared/SkillsBadgeList";
export { default as StatCard } from "@/components/shared/StatCard";
export { default as JobSummaryCard } from "@/components/shared/JobSummaryCard";
export { default as CandidateSearchForm } from "@/components/shared/CandidateSearchForm";
export { default as AppNavbar } from "@/components/shared/Navbar";
export { default as Logo } from "@/components/shared/Logo";
export { Skeleton, TextSkeleton, TableRowSkeleton, CardSkeleton } from "@/components/shared/Skeleton";
export { DataTable } from "@/components/shared/DataTable";
export { ToastProvider, useToast } from "@/components/shared/ToastProvider";
