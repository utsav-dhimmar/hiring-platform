import React from 'react';
import { Button as BSButton } from 'react-bootstrap';
import type { ButtonProps as BSButtonProps } from 'react-bootstrap';
import './Button.css';

interface ButtonProps extends Omit<BSButtonProps, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <BSButton
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      className={`custom-btn ${className}`}
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
