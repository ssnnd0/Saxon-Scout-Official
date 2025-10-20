const TOKEN_KEY = 'scout_app_token';
const USER_KEY = 'scout_app_user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'scout' | 'viewer';
  teamId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const setAuth = (data: AuthResponse): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const clearAuth = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const hasRole = (role: User['role'] | User['role'][]): boolean => {
  const user = getUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
};
