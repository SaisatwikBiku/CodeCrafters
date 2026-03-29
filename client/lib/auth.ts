export const AUTH = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cc_token');
  },
  getUsername: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cc_username');
  },
  setAuth: (token: string, username: string): void => {
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_username', username);
  },
  clearAuth: (): void => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_username');
  },
  isLoggedIn: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('cc_token');
  },
  authHeaders: (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('cc_token') : null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  },
};
