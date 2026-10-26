import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { expenseAPI } from './api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      expenseAPI('/auth/me')
        .then(data => {
          setUser(data);
          document.body.classList.add('logged-in'); 
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('current_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Wrap in useCallback so the function reference doesn't change on every render
  const login = useCallback(async (username, password) => {
    const data = await expenseAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('current_user', JSON.stringify(data.user));
    setUser(data.user);
    document.body.classList.add('logged-in'); 
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    setUser(null);
    document.body.classList.remove('logged-in'); 
    window.location.hash = '#/login';
  }, []);

  // Memoize the context value so it only updates when user or loading changes
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);