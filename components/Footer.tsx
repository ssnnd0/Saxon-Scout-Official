import React from 'react';
import { Heart, Github, ExternalLink } from 'lucide-react';
import { BRAND_INFO } from '../utils/iconConfig';

interface FooterProps {
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
}

export const Footer: React.FC<FooterProps> = ({ 
  className = '', 
  variant = 'full' 
}) => {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className={`text-center py-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 ${className}`}>
        <p>© {currentYear} {BRAND_INFO.team} - Team {BRAND_INFO.teamNumber}</p>
      </footer>
    );
  }

  if (variant === 'compact') {
    return (
      <footer className={`px-4 py-4 bg-slate-50 dark:bg-obsidian-light border-t border-slate-200 dark:border-slate-800 ${className}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-col sm:flex-row gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {BRAND_INFO.name}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              © {currentYear} {BRAND_INFO.team} #{BRAND_INFO.teamNumber}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/ssnnd0/Saxon-Scout-Official"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-matcha dark:hover:text-matcha transition-colors"
              aria-label="GitHub Repository"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`bg-slate-50 dark:bg-obsidian-light border-t border-slate-200 dark:border-slate-800 ${className}`}>
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="text-matcha">SAXON</span>
              <span className="text-white dark:text-matcha">SCOUT</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {BRAND_INFO.description}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
              Langley Robotics Team 611
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-matcha dark:hover:text-matcha transition-colors flex items-center gap-2">
                  <span>Documentation</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-matcha dark:hover:text-matcha transition-colors flex items-center gap-2">
                  <span>GitHub</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-matcha dark:hover:text-matcha transition-colors flex items-center gap-2">
                  <span>Issues</span>
                  <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Version
            </h4>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-medium">App:</span> v2026.3.0
              </p>
              <p>
                <span className="font-medium">Status:</span> 
                <span className="ml-2 inline-block px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs font-bold">
                  Production Ready
                </span>
              </p>
              <p>
                <span className="font-medium">Build:</span> January 26, 2026
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-700 py-6">
          {/* Support Section */}
          <div className="text-center mb-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
              Built with <Heart size={14} className="text-red-500" /> by the Robotics Team
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
              © {currentYear} {BRAND_INFO.team} - All Rights Reserved
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              FIRST Robotics Competition • Team 611 • Langley High School
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
              Made with passion for scouting excellence
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

/**
 * Minimal footer for pages that don't need full content
 */
export const FooterMinimal: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <Footer variant="minimal" className={className} />;
};

/**
 * Compact footer for sidebars and limited spaces
 */
export const FooterCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <Footer variant="compact" className={className} />;
};
