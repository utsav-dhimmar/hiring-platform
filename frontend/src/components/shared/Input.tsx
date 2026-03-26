/**
 * Custom input component with label, error handling, and icon support.
 * Uses shadcn Input component with custom styling.
 */

import React, { useId, forwardRef } from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Props for the Input component.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display below the input */
  error?: string;
  /** Helper text displayed below the input (shown when no error) */
  helperText?: string;
  /** Element to display before the input field */
  leftElement?: React.ReactNode;
  /** Element to display after the input field */
  rightElement?: React.ReactNode;
  /** Size variant for the input */
  inputSize?: "sm" | "lg";
}

/**
 * Input component with label, validation states, and icon support.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftElement,
      rightElement,
      inputSize,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const sizeClasses = {
      sm: "h-8 px-2 text-sm",
      lg: "h-12 px-4 text-lg",
      undefined: "h-10 px-3",
    };

    return (
      <div className={cn("space-y-2", error && "text-destructive", className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftElement}
            </div>
          )}
          <ShadcnInput
            id={inputId}
            className={cn(
              "w-full",
              leftElement && "pl-10",
              rightElement && "pr-10",
              sizeClasses[inputSize || "undefined"],
              error && "border-destructive focus-visible:ring-destructive"
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
