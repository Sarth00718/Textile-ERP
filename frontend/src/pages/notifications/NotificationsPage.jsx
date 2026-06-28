import { useEffect, useState } from 'react';
import { notificationApi } from '../../api/services';
import { PageHeader, Button, Card } from '../../components/common/Shared';
import StatusBadge from '../../components/common/StatusBadge';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    notificationApi.list({ limit: 100 }).then((res) => {
      setItems(res.data || []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  async function markRead(id) {
    await notificationApi.markRead(id);
    load();
  }

  async function markAllRead() {
    await notificationApi.markAllRead();
    load();
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System alerts across all modules"
        action={<Button variant="secondary" onClick={markAllRead}>Mark All Read</Button>}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-steel-200 dark:bg-steel-800" />)}
        </div>
      ) : items.length === 0 ? (
        <Card><p className="text-sm text-steel-400">No notifications yet.</p></Card>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <Card key={n.id} className={`flex items-start justify-between gap-3 ${!n.is_read ? 'border-amber-400' : ''}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={n.severity} />
                  <span className="font-medium text-sm text-steel-900 dark:text-steel-50">{n.title}</span>
                </div>
                <p className="text-sm text-steel-500 dark:text-steel-400">{n.message}</p>
                <p className="mt-1 text-xs text-steel-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark Read</Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
