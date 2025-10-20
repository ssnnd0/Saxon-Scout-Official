import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          border-blue-500 
          border-t-transparent 
          rounded-full 
          animate-spin
        `}
        role="status"
        aria-label="Loading..."
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default React.memo(LoadingSpinner);
