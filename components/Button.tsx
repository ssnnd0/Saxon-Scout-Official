import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'gold';
  fullWidth?: boolean;
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  active = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "px-6 py-4 rounded-xl font-bold transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-transparent flex items-center justify-center text-center";
  
  const variants = {
    // Primary: Matcha (Works on both light/dark due to black text)
    primary: "bg-matcha hover:bg-matcha-dark text-obsidian shadow-lg shadow-matcha/20",
    
    // Secondary: Adapted for Light/Dark
    secondary: "bg-white border-slate-200 hover:bg-slate-50 text-slate-900 dark:bg-slate-800/80 dark:backdrop-blur-md dark:hover:bg-slate-700/90 dark:text-slate-100 dark:border-slate-700 dark:hover:border-slate-500 shadow-sm",
    
    // Danger: Red
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50",
    
    // Success: Matcha
    success: "bg-matcha hover:bg-matcha-dark text-obsidian shadow-lg shadow-matcha/20",
    
    // Outline: Matcha text
    outline: "border-matcha text-matcha hover:bg-matcha/10",
    
    // Ghost: Adaptive text
    ghost: "bg-transparent hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300",
    
    // Gold Variant
    gold: "bg-gold hover:bg-gold-dark text-obsidian shadow-lg shadow-gold/20"
  };

  // Active state uses Gold ring
  const activeStyle = active ? "ring-2 ring-gold ring-offset-2 ring-offset-white dark:ring-offset-obsidian" : "";
  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${activeStyle} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};