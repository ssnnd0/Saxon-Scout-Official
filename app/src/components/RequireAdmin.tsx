import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Simple route guard that checks an admin flag.
 * Replace this with your real auth when available.
 */
export const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = React.useMemo(() => localStorage.getItem('saxon_admin') === 'true', [location.key]);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};
