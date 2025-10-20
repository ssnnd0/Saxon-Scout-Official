import { NavItem } from '../types/navigation';

export const NAV_ITEMS: NavItem[] = [
  { 
    path: '/', 
    icon: 'home', 
    label: 'Home', 
    exact: true 
  },
  { 
    path: '/quick', 
    icon: 'bolt', 
    label: 'Quick Scout', 
    requiresAuth: true 
  },
  { 
    path: '/pit', 
    icon: 'robot', 
    label: 'Pit Scouting', 
    requiresAuth: true 
  },
  { 
    path: '/alliance', 
    icon: 'users', 
    label: 'Alliance Selection', 
    requiresAuth: true 
  },
  { 
    path: '/match-planning', 
    icon: 'chess', 
    label: 'Match Planning', 
    requiresAuth: true 
  },
  { 
    path: '/analytics', 
    icon: 'chart-line', 
    label: 'Analytics', 
    requiresAuth: true 
  },
  { 
    path: '/schedule', 
    icon: 'calendar', 
    label: 'Schedule', 
    requiresAuth: true 
  },
  { 
    path: '/export', 
    icon: 'file-export', 
    label: 'Export', 
    requiresAuth: true, 
    adminOnly: true 
  },
  { 
    path: '/admin', 
    icon: 'shield-alt', 
    label: 'Admin', 
    requiresAuth: true, 
    adminOnly: true 
  },
  { 
    path: '/settings', 
    icon: 'cog', 
    label: 'Settings' 
  }
];
