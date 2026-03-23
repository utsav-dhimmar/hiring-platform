/**
 * Custom button component with loading state and icon support.
 * Wraps React Bootstrap Button with additional features.
 */

import React from "react";
import { Button as BSButton } from "react-bootstrap";
import type { ButtonProps as BSButtonProps } from "react-bootstrap";
import "@/css/button.css";

/**
 * Props for the Button component.
 * Extends React Bootstrap ButtonProps with custom options.
 */
interface ButtonProps extends Omit<BSButtonProps, "size"> {
  /** Visual style variant of the button */
  variant?:
  | "primary"
  | "secondary"
  | "outline-primary"
  | "outline-secondary"
  | "success"
  | "outline-success"
  | "danger"
  | "outline-danger"
  | "warning"
  | "ghost";
  /** Size of the button */
  size?: "sm" | "lg";
  /** Shows loading spinner and disables button when true */
  isLoading?: boolean;
  /** Icon element to display before button text */
  leftIcon?: React.ReactNode;
  /** Icon element to display after button text */
  rightIcon?: React.ReactNode;
}

/**
 * Button component with loading state and icon support.
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Submit
 * </Button>
 * ```
 * @example
 * ```tsx
 * <Button isLoading leftIcon={<Spinner />}>
 *   Saving...
 * </Button>
 * ```
 */
export function Button({
  children,
  variant = "primary",
  size,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <BSButton
      variant={variant === "ghost" ? "link" : variant}
      size={size}
      disabled={disabled || isLoading}
      className={`custom-btn flex-grow-1 ${variant === "ghost" ? "text-decoration-none shadow-none" : ""} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="custom-btn__loader">
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          <span className="visually-hidden">Loading...</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="custom-btn__icon">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="custom-btn__icon">{rightIcon}</span>}
        </>
      )}
    </BSButton>
  );
}

export default Button;
