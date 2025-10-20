import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-yellow-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-yellow-500',
  link: 'bg-transparent text-yellow-600 hover:text-yellow-700 hover:underline focus:ring-yellow-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  isLoading = false,
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;
  
  const buttonClasses = classNames(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    variantStyles[variant],
    sizeStyles[size],
    {
      'w-full': fullWidth,
      'opacity-50 cursor-not-allowed': isDisabled,
      'flex-row-reverse': iconPosition === 'right',
    },
    className
  );

  return (
    <button
      ref={ref}
      type={type as 'button' | 'submit' | 'reset' | undefined}
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <svg
          className={classNames(
            'animate-spin -ml-1 mr-2 h-4 w-4 text-current',
            { 'order-1 ml-2 mr-0': iconPosition === 'right' }
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !isLoading && (
        <span
          className={classNames({
            'mr-2': iconPosition === 'left' && children,
            'ml-2': iconPosition === 'right' && children,
          })}
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

// Button group component
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}> = ({ children, className = '', align = 'start' }) => {
  const alignment = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  };

  return (
    <div
      className={`flex flex-wrap gap-2 ${alignment[align]} ${className}`}
      role="group"
    >
      {React.Children.map(children, (child, index) => (
        <div key={index} className="inline-flex">
          {child}
        </div>
      ))}
    </div>
  );
};
