import React from 'react';
import { Form } from 'react-bootstrap';
import type { FormControlProps } from 'react-bootstrap';
import './Input.css';

interface InputProps extends Omit<FormControlProps, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  inputSize?: 'sm' | 'lg';
}

export function Input({
  label,
  error,
  helperText,
  leftElement,
  rightElement,
  inputSize,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`custom-input ${error ? 'custom-input--error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="custom-input__label">{label}</label>}
      <div className="custom-input__wrapper">
        {leftElement && <span className="custom-input__element custom-input__element--left">{leftElement}</span>}
        <Form.Control
          id={inputId}
          size={inputSize}
          className={`custom-input__field ${leftElement ? 'custom-input__field--with-left' : ''} ${rightElement ? 'custom-input__field--with-right' : ''}`}
          {...props}
        />
        {rightElement && <span className="custom-input__element custom-input__element--right">{rightElement}</span>}
      </div>
      {error && <span className="custom-input__error">{error}</span>}
      {helperText && !error && <span className="custom-input__helper">{helperText}</span>}
    </div>
  );
}

export default Input;
