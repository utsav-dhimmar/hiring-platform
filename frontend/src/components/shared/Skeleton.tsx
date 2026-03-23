/**
 * Skeleton loader components for better perceived performance.
 * Provides generic and specific skeleton variants.
 */

import React from "react";
import "@/components/shared/Skeleton.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export const Skeleton = ({ width, height, circle, className = "" }: SkeletonProps) => {
  const style: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: circle ? "50%" : "8px",
  };

  return <div className={`skeleton-bones ${className}`} style={style} />;
};

export const TextSkeleton = ({ lines = 1 }: { lines?: number }) => (
  <div className="text-skeleton-group">
    {[...Array(lines)].map((_, i) => (
      <Skeleton
        key={i}
        height="1rem"
        width={i === lines - 1 && lines > 1 ? "60%" : "100%"}
        className="mb-2"
      />
    ))}
  </div>
);

export const TableRowSkeleton = ({ columns }: { columns: number }) => (
  <tr>
    {[...Array(columns)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton height="1.2rem" width="80%" />
      </td>
    ))}
  </tr>
);

export const CardSkeleton = () => (
  <div className="card border-0 shadow-sm p-3 mb-3">
    <Skeleton height="150px" className="mb-3" />
    <Skeleton height="1.5rem" width="70%" className="mb-2" />
    <Skeleton height="1rem" width="40%" />
  </div>
);

export default Skeleton;
