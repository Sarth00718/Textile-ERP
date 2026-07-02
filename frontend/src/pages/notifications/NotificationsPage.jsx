import { useEffect, useState, useCallback } from 'react';
import { notificationApi } from '../../api/services';
import { PageHeader, Button, Card } from '../../components/common/Shared';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

const SEVERITY_BADGE = {
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  WARNING:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  INFO:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
};

const SEVERITY_BORDER = {
  CRITICAL: 'border-l-4 border-red-500',
  WARNING:  'border-l-4 border-amber-400',
  INFO:     'border-l-4 border-transparent',
};

const MODULE_ICONS = {
  leave:            '🏖️',
  payroll:          '💰',
  dispatch:         '🚚',
  inventory:        '📦',
  qualityControl:   '🔍',
  packing:          '📫',
  machineBreakdown: '⚠️',
  machineMaintenance:'🔧',
  productionOrders: '🏭',
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(dateStr).toLocaleDateString();
}

const FILTER_TABS = ['All', 'Unread', 'CRITICAL', 'WARNING', 'INFO'];

export default function NotificationsPage() {
  const [items, setItems]           = useState([]);
  const [unreadCount, setUnread]    = useState(0);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('All');

  const load = useCallback(() => {
    setLoading(true);
    notificationApi.list({ limit: 100 })
      .then((res) => {
        setItems(res.data || []);
        setUnread(res.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id) {
    await notificationApi.markRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await notificationApi.markAllRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  const filtered = items.filter((n) => {
    if (activeTab === 'Unread')   return !n.is_read;
    if (activeTab === 'CRITICAL') return n.severity === 'CRITICAL';
    if (activeTab === 'WARNING')  return n.severity === 'WARNING';
    if (activeTab === 'INFO')     return n.severity === 'INFO';
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System alerts across all modules"
        action={
          unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllRead}>
              <CheckIcon className="h-4 w-4" /> Mark All Read
            </Button>
          )
        }
      />

      {/* Stats bar */}
      <div className="mb-4 flex gap-3">
        {[
          { label: 'Unread', value: unreadCount, color: 'text-red-600' },
          { label: 'Critical', value: items.filter((n) => n.severity === 'CRITICAL').length, color: 'text-red-500' },
          { label: 'Warnings', value: items.filter((n) => n.severity === 'WARNING').length, color: 'text-amber-500' },
          { label: 'Total', value: items.length, color: 'text-steel-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg bg-white dark:bg-steel-800 border border-steel-200 dark:border-steel-700 px-4 py-2 text-center min-w-[70px]">
            <div className={`text-lg font-bold tabular ${color}`}>{value}</div>
            <div className="text-xs text-steel-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-steel-100 dark:bg-steel-800 p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-steel-700 text-steel-900 dark:text-steel-50 shadow-sm'
                : 'text-steel-500 hover:text-steel-700 dark:hover:text-steel-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-steel-200 dark:bg-steel-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-steel-400">
          <BellIcon className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No {activeTab !== 'All' ? activeTab.toLowerCase() + ' ' : ''}notifications</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-lg bg-white dark:bg-steel-800 border border-steel-200 dark:border-steel-700 px-4 py-3 transition-opacity ${SEVERITY_BORDER[n.severity] || ''} ${n.is_read ? 'opacity-60' : ''}`}
            >
              {/* Module icon */}
              <span className="text-xl flex-shrink-0 mt-0.5">
                {MODULE_ICONS[n.module] || '🔔'}
              </span>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-[11px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${SEVERITY_BADGE[n.severity] || SEVERITY_BADGE.INFO}`}>
                    {n.severity}
                  </span>
                  {n.module && (
                    <span className="text-[11px] text-steel-400 uppercase tracking-wide">{n.module}</span>
                  )}
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" title="Unread" />
                  )}
                </div>
                <p className="text-sm font-semibold text-steel-900 dark:text-steel-50 leading-snug">{n.title}</p>
                <p className="text-sm text-steel-500 dark:text-steel-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-steel-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>

              {/* Action */}
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="flex-shrink-0 rounded-md border border-steel-200 dark:border-steel-600 px-2.5 py-1.5 text-xs text-steel-600 dark:text-steel-300 hover:bg-steel-100 dark:hover:bg-steel-700 font-medium"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
