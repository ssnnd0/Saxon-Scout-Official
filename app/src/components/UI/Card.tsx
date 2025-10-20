import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          {title && (
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {title}
            </h3>
          )}
          {actions && <div className="mt-3 sm:mt-0 sm:ml-4">{actions}</div>}
        </div>
      )}
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  );
};

interface CardGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export const CardGrid: React.FC<CardGridProps> = ({ 
  children, 
  className = '',
  cols = 3 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-6 ${className}`}>
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = '',
}) => {
  const trendColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
            {icon || (
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            )}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {trend && (
                <div
                  className={`ml-2 flex items-baseline text-sm font-semibold ${trendColors[trend.type]}`}
                >
                  {trend.type === 'increase' ? (
                    <>
                      <svg
                        className="self-center flex-shrink-0 h-5 w-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="sr-only">
                        Increased by
                      </span>
                    </>
                  ) : trend.type === 'decrease' ? (
                    <>
                      <svg
                        className="self-center flex-shrink-0 h-5 w-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="sr-only">
                        Decreased by
                      </span>
                    </>
                  ) : (
                    <span className="sr-only">
                      No change
                    </span>
                  )}
                  {trend.value}
                </div>
              )}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
};
