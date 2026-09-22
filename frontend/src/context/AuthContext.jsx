import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_STORAGE_KEY } from '../config';
import { onUnauthorized } from '../api/client';
import { loginUser, registerUser } from '../api/auth';
import { getMyProfile } from '../api/users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  // "booting" = we have a token from a previous session and are verifying it
  // by fetching the profile, before we know whether the app should show the
  // dashboard or the login page.
  const [booting, setBooting] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setBooting(false);
  }, []);

  // If the API ever responds 401, treat the session as dead.
  useEffect(() => onUnauthorized(clearSession), [clearSession]);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setBooting(false);
      return undefined;
    }

    getMyProfile()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
          setBooting(false);
        }
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });

    return () => {
      cancelled = true;
    };
    // Only re-run when the token itself changes (e.g. after login/logout).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginUser({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    setToken(data.access_token);
    const profile = await getMyProfile();
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(({ email, password }) => {
    return registerUser({ email, password });
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      booting,
      login,
      register,
      logout,
    }),
    [token, user, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
