import React, { InputHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames';

type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  label,
  error,
  helperText,
  size = 'md',
  fullWidth = false,
  startIcon,
  endIcon,
  containerClassName = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const hasHelperText = !!helperText || hasError;

  const inputClasses = classNames(
    'block w-full rounded-md border bg-white text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizeClasses[size],
    {
      'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500': !hasError,
      'border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': hasError,
      'pl-10': startIcon,
      'pr-10': endIcon,
    },
    className
  );

  const containerClasses = classNames(
    'relative',
    {
      'w-full': fullWidth,
      'inline-block': !fullWidth,
    },
    containerClassName
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{startIcon}</span>
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={hasHelperText ? `${inputId}-helper-text` : undefined}
          {...props}
        />
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{endIcon}</span>
          </div>
        )}
      </div>
      {hasHelperText && (
        <p
          id={`${inputId}-helper-text`}
          className={classNames('mt-1 text-sm', {
            'text-gray-500': !hasError,
            'text-red-600': hasError,
          })}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea component
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  InputProps & { rows?: number; resize?: 'none' | 'both' | 'horizontal' | 'vertical' }
>(({ className = '', label, error, helperText, size = 'md', fullWidth = false, id, resize = 'vertical', ...props }, ref) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const hasHelperText = !!helperText || hasError;

  const textareaClasses = classNames(
    'block w-full rounded-md border bg-white text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizeClasses[size],
    {
      'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500': !hasError,
      'border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': hasError,
      'resize-none': resize === 'none',
      'resize': resize === 'both',
      'resize-x': resize === 'horizontal',
      'resize-y': resize === 'vertical',
    },
    className
  );

  const containerClasses = classNames(
    'relative',
    {
      'w-full': fullWidth,
      'inline-block': !fullWidth,
    }
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        <textarea
          id={inputId}
          ref={ref}
          className={textareaClasses}
          aria-invalid={hasError}
          aria-describedby={hasHelperText ? `${inputId}-helper-text` : undefined}
          {...props}
        />
      </div>
      {hasHelperText && (
        <p
          id={`${inputId}-helper-text`}
          className={classNames('mt-1 text-sm', {
            'text-gray-500': !hasError,
            'text-red-600': hasError,
          })}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
