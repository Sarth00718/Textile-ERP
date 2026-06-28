import { create } from 'zustand';
import { factorySettingsApi } from '../api/services';

const STORAGE_KEY = 'textile_erp_theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useUIStore = create((set, get) => ({
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  publicSettings: null,

  fetchPublicSettings: async () => {
    try {
      const res = await factorySettingsApi.getPublic();
      set({ publicSettings: res.data });
      if (res.data?.factoryName) {
        document.title = `${res.data.factoryName} — ERP`;
      }
    } catch (err) {
      console.error('Failed to fetch public factory settings', err);
    }
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },

  toggleSidebar: () => set((state) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return { sidebarMobileOpen: !state.sidebarMobileOpen };
    }
    return { sidebarCollapsed: !state.sidebarCollapsed };
  }),

  closeMobileSidebar: () => set({ sidebarMobileOpen: false }),
}));

// Apply initial theme class on load
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', getInitialTheme() === 'dark');
}
