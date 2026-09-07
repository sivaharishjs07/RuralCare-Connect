'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Filter,
  Loader2,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabaseClient } from '@/lib/supabase/client';
import type { Notification, Patient } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePatientLanguage } from '@/lib/i18n/patient-language';

type ReadFilter = 'all' | 'unread' | 'read';
type NotificationType = Exclude<Notification['type'], null>;
type TypeFilter = 'all' | NotificationType;

const notificationTypes: { value: NotificationType; label: string }[] = [
  { value: 'referral', label: 'Referral' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'triage', label: 'Triage' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'system', label: 'System' },
];

function typeLabel(type: string | null) {
  return notificationTypes.find((option) => option.value === type)?.label ?? type?.replaceAll('_', ' ') ?? 'Uncategorized';
}

function typeClasses(type: string | null) {
  switch (type) {
    case 'referral': return 'bg-primary/10 text-primary';
    case 'appointment': return 'bg-accent/10 text-accent';
    case 'follow_up': return 'bg-secondary/10 text-secondary';
    case 'triage': return 'bg-warning/10 text-warning-foreground';
    case 'inventory': return 'bg-success/10 text-success';
    default: return 'bg-muted text-muted-foreground';
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = usePatientLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const loadNotifications = async (userId: string) => {
    setLoading(true);
    setError(null);
    const notificationResult = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notificationResult.error) {
      setError(notificationResult.error.message);
      setNotifications([]);
      setPatients([]);
      setLoading(false);
      return;
    }

    const loadedNotifications = (notificationResult.data ?? []) as Notification[];
    setNotifications(loadedNotifications);

    const patientIds = Array.from(new Set(loadedNotifications.map((notification) => notification.patient_id).filter((id): id is string => Boolean(id))));
    if (patientIds.length === 0) {
      setPatients([]);
      setLoading(false);
      return;
    }

    const patientResult = await supabaseClient.from('patients').select('*').in('id', patientIds);
    setPatients(patientResult.error ? [] : (patientResult.data ?? []) as Patient[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setPatients([]);
      setLoading(false);
      return;
    }
    void loadNotifications(user.id);
  }, [user?.id]);

  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.full_name])), [patients]);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const filteredNotifications = useMemo(() => notifications.filter((notification) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || notification.title.toLowerCase().includes(query) || notification.message.toLowerCase().includes(query);
    const matchesRead = readFilter === 'all' || (readFilter === 'unread' && !notification.is_read) || (readFilter === 'read' && notification.is_read);
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    return matchesSearch && matchesRead && matchesType;
  }), [notifications, readFilter, search, typeFilter]);

  const resetFilters = () => {
    setSearch('');
    setReadFilter('all');
    setTypeFilter('all');
  };

  const markAsRead = async (notification: Notification) => {
    if (!user?.id || notification.is_read) return;
    setUpdatingId(notification.id);
    setError(null);
    setNotice(null);
    const { error: updateError } = await supabaseClient
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('id', notification.id)
      .eq('user_id', user.id);

    if (updateError) {
      setError(`Unable to mark notification as read: ${updateError.message}`);
    } else {
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
      setNotice('Notification marked as read.');
    }
    setUpdatingId(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Your care updates</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('notifications')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review updates and messages available to your authenticated account.</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm"><span className="font-semibold text-primary">{unreadCount}</span><span className="ml-1 text-muted-foreground">unread</span></div>
      </div>

      {notice && <div className="mb-6 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success" role="status"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
      {error && <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">{t('error')}</p><p className="mt-1">{error}</p>{user?.id && <Button type="button" variant="outline" size="sm" onClick={() => void loadNotifications(user.id)} className="mt-3">{t('tryAgain')}</Button>}</div></div>}

      <Card className="mb-6"><CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or message" className="pl-9" aria-label="Search notifications" /></div><div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={readFilter} onChange={(event) => setReadFilter(event.target.value as ReadFilter)} className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Filter by read status"><option value="all">All notifications</option><option value="unread">Unread</option><option value="read">Read</option></select></div><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Filter by notification type"><option value="all">All types</option>{notificationTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Button type="button" variant="ghost" size="icon" onClick={resetFilters} aria-label="Clear notification filters"><X className="h-4 w-4" /></Button></CardContent></Card>

      <div className="mb-4"><h2 className="text-lg font-semibold text-foreground">{t('notifications')}</h2><p className="text-sm text-muted-foreground">{loading ? t('loading') : `${filteredNotifications.length} notification${filteredNotifications.length === 1 ? '' : 's'} shown`}</p></div>
      {loading && <div className="flex min-h-48 items-center justify-center rounded-lg border border-border/70 bg-card"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2 text-sm text-muted-foreground">Loading notifications...</span></div>}
      {!loading && !error && filteredNotifications.length === 0 && <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center"><Bell className="h-8 w-8 text-muted-foreground/60" /><h3 className="mt-3 font-semibold text-foreground">{search || readFilter !== 'all' || typeFilter !== 'all' ? 'No matching notifications' : 'No notifications yet'}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{search || readFilter !== 'all' || typeFilter !== 'all' ? 'Try clearing or changing the filters.' : 'Notifications for your account will appear here when available.'}</p></div>}
      {!loading && !error && filteredNotifications.length > 0 && <div className="space-y-3">{filteredNotifications.map((notification) => <Card key={notification.id} className={notification.is_read ? 'bg-card' : 'border-primary/30 bg-primary/[0.03]'}><CardContent className="p-5"><div className="flex items-start gap-4"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${typeClasses(notification.type)}`}><Bell className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className={`font-semibold ${notification.is_read ? 'text-foreground' : 'text-primary'}`}>{notification.title}</h3>{!notification.is_read && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Unread</span>}</div><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${typeClasses(notification.type)}`}>{typeLabel(notification.type)}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{notification.message}</p>{notification.patient_id && <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-4 w-4 text-primary" /><span>{patientNames.get(notification.patient_id) ?? 'Related patient unavailable'}</span></div>}<div className="mt-4 flex justify-end">{!notification.is_read && <Button type="button" variant="outline" size="sm" disabled={updatingId === notification.id} onClick={() => void markAsRead(notification)}>{updatingId === notification.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-2 h-3.5 w-3.5" />}Mark as read</Button>}</div></div></div></CardContent></Card>)}</div>}
    </div>
  );
}