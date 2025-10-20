import { DirHandle } from '../../lib/fsStore';

export interface NavItem {
  path: string;
  icon: string;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  exact?: boolean;
}

export interface AppShellProps {
  root: DirHandle | null;
  scouter: string;
  onLogout: () => void;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  showLabel?: boolean;
}
