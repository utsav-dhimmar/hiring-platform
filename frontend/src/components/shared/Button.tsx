/**
 * Custom button component with loading state and icon support.
 * Uses shadcn Button with additional features.
 */

import React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the Button component.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Size of the button */
  size?: "default" | "sm" | "lg" | "icon";
  /** Shows loading spinner and disables button when true */
  isLoading?: boolean;
  /** Icon element to display before button text */
  leftIcon?: React.ReactNode;
  /** Icon element to display after button text */
  rightIcon?: React.ReactNode;
}

/**
 * Button component with loading state and icon support.
 */
export function Button({
  children,
  variant = "default",
  size = "default",
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <ShadcnButton
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      className={cn("gap-2", className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </ShadcnButton>
  );
}

export default Button;
