import React, { memo } from 'react';
import { NavLinkProps } from '../../types/navigation';

const NavLink: React.FC<NavLinkProps> = memo(({ 
  item, 
  isActive, 
  onClick,
  className = '',
  showLabel = true
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  return (
    <button
      className={`flex items-center p-3 rounded-md transition-colors w-full text-left group ${
        isActive
          ? 'bg-saxon-gold text-white'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      } ${className}`}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={showLabel ? undefined : item.label}
      title={!showLabel ? item.label : undefined}
    >
      <i 
        className={`fa fa-${item.icon} w-6 text-center transition-transform group-hover:scale-110`} 
        aria-hidden="true"
      />
      {showLabel && (
        <span className="ml-3 transition-opacity duration-200">
          {item.label}
        </span>
      )}
      {isActive && (
        <span className="ml-auto w-1 h-6 bg-white rounded-full"></span>
      )}
    </button>
  );
});

NavLink.displayName = 'NavLink';

export default NavLink;
