import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon, SunIcon, MoonIcon, BellIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { notificationApi } from '../../api/services';

export default function TopNavbar() {
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    notificationApi.list({ unreadOnly: 'true', limit: 1 }).then((res) => {
      setUnreadCount(res.data?.length || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

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

      <button onClick={toggleTheme} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800">
        {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>

      <button
        onClick={() => navigate('/user-guide')}
        className="rounded-md p-1.5 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800"
        aria-label="User Guide"
      >
        <QuestionMarkCircleIcon className="h-5 w-5" />
      </button>

      <button
        onClick={() => navigate('/notifications')}
        className="relative rounded-md p-1.5 text-steel-500 hover:bg-steel-100 dark:hover:bg-steel-800"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-steel-100 dark:hover:bg-steel-800"
        >
          <div className="h-7 w-7 rounded-full bg-steel-700 text-white flex items-center justify-center text-xs font-semibold">
            {user?.fullName?.charAt(0) || '?'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-steel-800 dark:text-steel-100 leading-tight">{user?.fullName}</div>
            <div className="text-xs text-steel-400 leading-tight">{user?.role}</div>
          </div>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-44 rounded-md border border-steel-200 dark:border-steel-700 bg-white dark:bg-steel-800 shadow-lg py-1 z-20">
            <button
              onClick={() => { setMenuOpen(false); navigate('/profile'); }}
              className="block w-full px-3 py-2 text-left text-sm text-steel-700 dark:text-steel-200 hover:bg-steel-100 dark:hover:bg-steel-700"
            >
              My Profile
            </button>
            <button
              onClick={handleLogout}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-steel-100 dark:hover:bg-steel-700"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
