'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Hospital,
  LogOut,
  Menu,
  Package,
  PhoneCall,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ROLE_LABELS } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';
import { ConnectivityStatus } from '@/components/layout/connectivity-status';
import { usePatientLanguage, type PatientLanguage } from '@/lib/i18n/patient-language';
import { supabaseClient } from '@/lib/supabase/client';

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Activity },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Triage', href: '/triage', icon: Stethoscope },
  { label: 'Appointments', href: '/appointments', icon: CalendarDays },
  { label: 'IVR', href: '/ivr', icon: PhoneCall },
  { label: 'Referrals', href: '/referrals', icon: ClipboardList },
  { label: 'Follow-ups', href: '/follow-ups', icon: HeartPulse },
  { label: 'Medicines', href: '/medicines', icon: Package },
  { label: 'Facilities', href: '/facilities', icon: Hospital },
  { label: 'Notifications', href: '/notifications', icon: Bell },
];

const patientBookingItem = {
  label: 'Book Appointment',
  href: '/appointments/book',
  icon: CalendarDays,
};

function UserSummary() {
  const { profile, user } = useAuth();
  const { language, setLanguage, t } = usePatientLanguage();

  useEffect(() => {
    if (profile?.language === 'en' || profile?.language === 'mr' || profile?.language === 'hi') setLanguage(profile.language);
  }, [profile?.language, setLanguage]);

  const changeLanguage = (nextLanguage: PatientLanguage) => {
    setLanguage(nextLanguage);
    if (user && navigator.onLine) {
      void supabaseClient.from('profiles').update({ language: nextLanguage } as never).eq('id', user.id);
    }
  };
  const name = profile?.full_name ?? 'User';
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        <p className="mt-1 text-xs font-medium text-primary">
          {profile ? ROLE_LABELS[profile.role] : 'Loading role'}
        </p>
      </div>
    </div>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useAuth();
  const items = role === 'patient'
    ? [...navigationItems, patientBookingItem]
    : navigationItems;

  return (
    <nav className="space-y-1" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton({ mobile = false }: { mobile?: boolean }) {
  const { signOut } = useAuth();

  return (
    <button
      type="button"
      onClick={() => signOut()}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive',
        mobile && 'border border-border/70'
      )}
    >
      <LogOut className="h-[18px] w-[18px]" />
      Sign out
    </button>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
        <HeartPulse className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight text-foreground">RuralCare Connect</span>
        <span className="mt-1 text-[11px] font-medium text-muted-foreground">Care coordination</span>
      </div>
    </Link>
  );
}

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  return (
    <aside className={cn('flex h-full flex-col bg-card', mobile ? 'w-[min(20rem,88vw)] border-r border-border' : 'w-64 border-r border-border/70')}>
      <div className="flex h-16 items-center justify-between border-b border-border/70 px-5">
        <Brand />
        {mobile && (
          <button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
        <Navigation onNavigate={onClose} />
      </div>
      <div className="space-y-4 border-t border-border/70 p-4">
        <UserSummary />
        <SignOutButton mobile={mobile} />
      </div>
    </aside>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, user } = useAuth();
  const { language, setLanguage, t } = usePatientLanguage();

  useEffect(() => {
    if (profile?.language === 'en' || profile?.language === 'mr' || profile?.language === 'hi') {
      setLanguage(profile.language);
    }
  }, [profile?.language, setLanguage]);

  const changeLanguage = (nextLanguage: PatientLanguage) => {
    setLanguage(nextLanguage);
    if (user && navigator.onLine) {
      void supabaseClient.from('profiles').update({ language: nextLanguage } as never).eq('id', user.id);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button type="button" className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <div className="relative z-10 h-full">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-foreground">{profile?.full_name ?? 'Your workspace'}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={language} onChange={(event) => changeLanguage(event.target.value as PatientLanguage)} aria-label={t('language')} className="h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground">
              <option value="en">English</option>
              <option value="mr">मराठी</option>
              <option value="hi">हिन्दी</option>
            </select>
            <ConnectivityStatus />
            <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-xs font-semibold text-primary">{profile ? ROLE_LABELS[profile.role] : 'Account'}</span>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}