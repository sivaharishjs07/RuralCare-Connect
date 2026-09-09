'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getAllOutboxItems } from '@/lib/offline/indexed-db';
import { syncPendingPatientAppointments } from '@/lib/offline/appointment-sync';

export function ConnectivityStatus() {
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<string | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);

    const refreshQueue = async () => {
      try {
        const items = await getAllOutboxItems();
        const relevant = user?.id ? items.filter((item) => item.ownerId === user.id) : items;
        const pending = relevant.filter((item) => item.syncStatus !== 'syncing').length;
        const failed = relevant.filter((item) => item.syncStatus === 'failed').length;
        setPendingCount(pending);
        setFailedCount(failed);
      } catch {
        setPendingCount(0);
        setFailedCount(0);
      }
    };

    const syncNow = async () => {
      if (!online || !user?.id) {
        await refreshQueue();
        return;
      }

      setSyncing(true);
      try {
        const synced = await syncPendingPatientAppointments(user.id);
        if (synced > 0) {
          setLastSuccessfulSync(new Date().toISOString());
        }
      } catch {
        // Keep the queue pending and let the next online event retry.
      } finally {
        setSyncing(false);
        await refreshQueue();
      }
    };

    void refreshQueue();
    if (online && user?.id) {
      void syncNow();
    }

    const handleOnline = () => {
      setOnline(true);
      void syncNow();
    };
    const handleOffline = () => {
      setOnline(false);
      setSyncing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [online, user?.id]);

  const status = useMemo(() => {
    if (!online) return 'offline';
    if (syncing) return 'syncing';
    if (pendingCount > 0 || failedCount > 0) return 'pending';
    if (lastSuccessfulSync) return 'synced';
    return 'online';
  }, [failedCount, lastSuccessfulSync, online, pendingCount, syncing]);

  const label = {
    online: 'Online',
    offline: 'Offline — changes will sync when connection returns',
    syncing: 'Syncing...',
    synced: 'All changes synced',
    pending: failedCount > 0 ? 'Some changes are waiting to sync' : `Offline — ${pendingCount} changes waiting to sync`,
  }[status];

  const accent = {
    online: 'border-success/25 bg-success/5 text-success',
    offline: 'border-warning/40 bg-warning/10 text-warning-foreground',
    syncing: 'border-primary/25 bg-primary/5 text-primary',
    synced: 'border-success/25 bg-success/5 text-success',
    pending: 'border-warning/40 bg-warning/10 text-warning-foreground',
  }[status];

  const Icon = status === 'online' ? Wifi : status === 'syncing' ? RefreshCw : status === 'synced' ? CheckCircle2 : status === 'pending' ? AlertTriangle : CloudOff;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${accent}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Icon className={`h-3.5 w-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
      <span>{label}</span>
    </div>
  );
}