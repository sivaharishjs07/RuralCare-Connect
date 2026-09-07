'use client';

import { useEffect, useState } from 'react';
import { CloudOff, Wifi } from 'lucide-react';

export function ConnectivityStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={online
        ? 'inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/5 px-2.5 py-1 text-xs font-semibold text-success'
        : 'inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning-foreground'}
      role="status"
      aria-live="polite"
      aria-label={online ? 'Online' : 'Offline. Changes require a connection.'}
    >
      {online ? <Wifi className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
      <span>{online ? 'Online' : 'Offline'}</span>
    </div>
  );
}