/**
 * Custom input component with label, error handling, and icon support.
 * Wraps React Bootstrap Form.Control with enhanced styling.
 */

import React, { useId, forwardRef } from "react";
import { Form } from "react-bootstrap";
import type { FormControlProps } from "react-bootstrap";
import "../../css/input.css";

/**
 * Props for the Input component.
 * Extends React Bootstrap FormControlProps with custom options.
 */
interface InputProps extends Omit<FormControlProps, "size"> {
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
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email?.message}
 * />
 * ```
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

    return (
      <div
        className={`custom-input ${error ? "custom-input--error" : ""} ${className}`}
      >
        {label && (
          <label htmlFor={inputId} className="custom-input__label">
            {label}
          </label>
        )}
        <div className="custom-input__wrapper">
          {leftElement && (
            <span className="custom-input__element custom-input__element--left">
              {leftElement}
            </span>
          )}
          <Form.Control
            id={inputId}
            size={inputSize}
            className={`custom-input__field ${leftElement ? "custom-input__field--with-left" : ""} ${rightElement ? "custom-input__field--with-right" : ""}`}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <span className="custom-input__element custom-input__element--right">
              {rightElement}
            </span>
          )}
        </div>
        {error && <span className="custom-input__error">{error}</span>}
        {helperText && !error && (
          <span className="custom-input__helper">{helperText}</span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
