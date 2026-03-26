/**
 * Custom Card component with hover and click states.
 * Uses Tailwind CSS for styling.
 */

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the Card component.
 */
interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover effect styling */
  hoverable?: boolean;
  /** Makes the card clickable with cursor pointer */
  clickable?: boolean;
  /** Callback fired when card is clicked */
  onCardClick?: () => void;
}

/**
 * Card container component with optional hover and click states.
 */
export function Card({
  children,
  hoverable = false,
  clickable = false,
  onCardClick,
  className = "",
  ...props
}: CustomCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        hoverable && "transition-colors hover:bg-muted/50",
        clickable && "cursor-pointer",
        className
      )}
      onClick={clickable ? onCardClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card header component with custom styling.
 */
export function CardHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card body component with custom styling.
 */
export function CardBody({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card footer component with custom styling.
 */
export function CardFooter({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
