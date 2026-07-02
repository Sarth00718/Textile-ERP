import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon, SunIcon, MoonIcon, BellIcon, MagnifyingGlassIcon,
  QuestionMarkCircleIcon, CheckIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { notificationApi } from '../../api/services';

const SEVERITY_STYLES = {
  CRITICAL: 'bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500',
  WARNING:  'bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400',
  INFO:     'bg-white dark:bg-steel-800 border-l-4 border-transparent',
};

const SEVERITY_DOT = {
  CRITICAL: 'bg-red-500',
  WARNING:  'bg-amber-400',
  INFO:     'bg-blue-400',
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TopNavbar() {
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const panelRef = useRef(null);
  const userMenuRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch unread count — runs on mount and polls every 30s
  const fetchCount = useCallback(() => {
    notificationApi.unreadCount()
      .then((res) => setUnreadCount(res.data?.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCount();
    pollRef.current = setInterval(fetchCount, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchCount]);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (!panelOpen) return;
    setLoading(true);
    notificationApi.list({ limit: 20 })
      .then((res) => {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [panelOpen]);

  // Close panels on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setPanelOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleMarkRead(id) {
    await notificationApi.markRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await notificationApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-steel-200 dark:border-steel-700 bg-white dark:bg-steel-900 px-4">
      <button onClick={toggleSidebar} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800">
        <Bars3Icon className="h-5 w-5" />
      </button>

      <div className="relative hidden sm:block flex-1 max-w-md">
        <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-steel-400" />
        <input
          placeholder="Search orders, machines, employees…"
          className="w-full rounded-md border border-steel-300 dark:border-steel-600 bg-steel-50 dark:bg-steel-800 pl-8 pr-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button onClick={toggleTheme} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800">
        {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>

      {/* User guide */}
      <button onClick={() => navigate('/user-guide')} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800" aria-label="User Guide">
        <QuestionMarkCircleIcon className="h-5 w-5" />
      </button>

      {/* Notification bell + dropdown panel */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setPanelOpen((o) => !o)}
          className="relative rounded-md p-1.5 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {panelOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-steel-200 dark:border-steel-700 bg-white dark:bg-steel-900 shadow-2xl z-50 flex flex-col max-h-[520px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-steel-100 dark:border-steel-800">
              <span className="font-semibold text-steel-800 dark:text-steel-100 text-sm">
                Notifications {unreadCount > 0 && <span className="ml-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs px-1.5 py-0.5">{unreadCount} new</span>}
              </span>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20">
                    <CheckIcon className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
                <button onClick={() => { setPanelOpen(false); navigate('/notifications'); }} className="text-xs text-steel-500 hover:text-steel-700 px-2 py-1 rounded hover:bg-steel-100 dark:hover:bg-steel-800">
                  View all
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loading && (
                <div className="flex items-center justify-center py-8 text-steel-400 text-sm">Loading…</div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-steel-400">
                  <BellIcon className="h-8 w-8 mb-2 opacity-40" />
                  <span className="text-sm">You're all caught up</span>
                </div>
              )}
              {!loading && notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-steel-50 dark:hover:bg-steel-800/60 transition-colors ${SEVERITY_STYLES[n.severity] || SEVERITY_STYLES.INFO} ${n.is_read ? 'opacity-60' : ''}`}
                  onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                >
                  {/* Severity dot */}
                  <span className={`mt-1.5 flex-shrink-0 h-2 w-2 rounded-full ${SEVERITY_DOT[n.severity] || SEVERITY_DOT.INFO}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-steel-800 dark:text-steel-100 leading-tight truncate">{n.title}</p>
                    <p className="text-xs text-steel-500 dark:text-steel-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-steel-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                      className="flex-shrink-0 self-start mt-1 rounded p-0.5 hover:bg-steel-200 dark:hover:bg-steel-700"
                      title="Mark as read"
                    >
                      <XMarkIcon className="h-3.5 w-3.5 text-steel-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-steel-100 dark:border-steel-800 text-center">
                <button onClick={() => { setPanelOpen(false); navigate('/notifications'); }} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                  See all notifications →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-steel-100 dark:hover:bg-steel-800">
          <div className="h-7 w-7 rounded-full bg-steel-700 text-white flex items-center justify-center text-xs font-semibold">
            {user?.fullName?.charAt(0) || '?'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-steel-800 dark:text-steel-100 leading-tight">{user?.fullName}</div>
            <div className="text-xs text-steel-400 leading-tight">{user?.role}</div>
          </div>
        </button>
        {userMenuOpen && (
          <div className="absolute right-0 mt-1 w-44 rounded-md border border-steel-200 dark:border-steel-700 bg-white dark:bg-steel-800 shadow-lg py-1 z-20">
            <button onClick={() => { setUserMenuOpen(false); navigate('/profile'); }} className="block w-full px-3 py-2 text-left text-sm text-steel-700 dark:text-steel-200 hover:bg-steel-100 dark:hover:bg-steel-700">
              My Profile
            </button>
            <button onClick={handleLogout} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-steel-100 dark:hover:bg-steel-700">
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
