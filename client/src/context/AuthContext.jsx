import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '../services/authService';
import { bindAuthHandlers } from '../services/api';

export const AuthContext = createContext(null);

const STORAGE_KEY = 'hms_auth_state';

const readSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readSession() || { user: null, tokens: null });
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;

    if (session.tokens) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  useEffect(() => {
    bindAuthHandlers({
      getAccessToken: () => sessionRef.current?.tokens?.accessToken,
      getRefreshToken: () => sessionRef.current?.tokens?.refreshToken,
      onSessionRefreshed: (payload) => {
        setSession((current) => ({
          user: payload.user || current.user,
          tokens: payload.tokens,
        }));
      },
      onSessionExpired: () => {
        setSession({ user: null, tokens: null });
      },
    });
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = readSession();

      if (!stored?.tokens) {
        setLoading(false);
        return;
      }

      setSession(stored);

      try {
        const response = await authService.getMe();
        setSession((current) => ({
          ...current,
          user: response.user,
        }));
      } catch (error) {
        setSession({ user: null, tokens: null });
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const register = async (payload) => {
    const response = await authService.register(payload);
    setSession({ user: response.user, tokens: response.tokens });
    return response;
  };

  const login = async (payload) => {
    const response = await authService.login(payload);
    setSession({ user: response.user, tokens: response.tokens });
    return response;
  };

  const logout = async () => {
    try {
      if (sessionRef.current?.tokens?.refreshToken) {
        await authService.logout(sessionRef.current.tokens.refreshToken);
      }
    } finally {
      setSession({ user: null, tokens: null });
    }
  };

  const value = useMemo(
    () => ({
      user: session.user,
      tokens: session.tokens,
      loading,
      isAuthenticated: Boolean(session.user && session.tokens?.accessToken),
      register,
      login,
      logout,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
