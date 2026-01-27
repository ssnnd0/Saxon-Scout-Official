import React from 'react';
import { APP_ICONS, ICON_SIZES } from '../utils/iconConfig';

interface LogoProps {
  variant?: 'text' | 'icon' | 'full' | 'compact';
  size?: keyof typeof ICON_SIZES;
  className?: string;
  showTeam?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'MD',
  className = '',
  showTeam = true
}) => {
  const isDark = document.documentElement.classList.contains('dark');
  const sizeValue = ICON_SIZES[size];

  if (variant === 'icon') {
    return (
      <img
        src={APP_ICONS.logo.square}
        alt="SaxonScout Logo"
        width={sizeValue}
        height={sizeValue}
        className={`rounded-lg ${className}`}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img
          src={APP_ICONS.logo.square}
          alt="Logo"
          width={sizeValue}
          height={sizeValue}
          className="rounded-lg"
        />
        <span className="font-bold dark:text-white text-obsidian tracking-tight">SCOUT</span>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={className}>
        <h1 className="text-5xl font-black dark:text-white text-obsidian tracking-tighter">
          SAXON<span className="text-matcha">SCOUT</span>
        </h1>
        {showTeam && (
          <p className="text-gold tracking-[0.2em] text-xs font-bold uppercase">
            Langley Saxons 611
          </p>
        )}
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <img
        src={APP_ICONS.logo.square}
        alt="SaxonScout Logo"
        width={sizeValue}
        height={sizeValue}
        className="rounded-lg shadow-lg"
      />
      <div>
        <h1 className="text-3xl font-black dark:text-white text-obsidian tracking-tighter">
          SAXON<span className="text-matcha">SCOUT</span>
        </h1>
        {showTeam && (
          <p className="text-gold tracking-[0.2em] text-xs font-bold uppercase">
            Langley Saxons 611
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Icon Display Component
 * Shows a specific icon from the icon set
 */
interface IconDisplayProps {
  source: 'pwa' | 'apple' | 'windows' | 'favicon';
  size?: string;
  alt?: string;
  className?: string;
}

export const IconDisplay: React.FC<IconDisplayProps> = ({
  source,
  size,
  alt = 'Icon',
  className = ''
}) => {
  const icons = APP_ICONS[source];
  
  if (typeof icons === 'string') {
    return <img src={icons} alt={alt} className={className} />;
  }

  const path = size && size in icons ? icons[size as keyof typeof icons] : Object.values(icons)[0];

  return (
    <img 
      src={path as string} 
      alt={alt} 
      className={className}
    />
  );
};
