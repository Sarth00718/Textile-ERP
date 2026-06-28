import { create } from 'zustand';

const STORAGE_KEY = 'textile_erp_session';

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(session) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) -- session simply won't persist
  }
}

const stored = loadStoredSession();

export const useAuthStore = create((set) => ({
  user: stored?.user || null,
  accessToken: stored?.accessToken || null,
  refreshToken: stored?.refreshToken || null,
  isAuthenticated: !!stored?.accessToken,

  setSession: ({ user, accessToken, refreshToken }) => {
    const session = { user, accessToken, refreshToken };
    persistSession(session);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  updateUser: (user) =>
    set((state) => {
      const session = { user, accessToken: state.accessToken, refreshToken: state.refreshToken };
      persistSession(session);
      return { user };
    }),

  logout: () => {
    persistSession(null);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
