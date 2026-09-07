'use client';

import { HeartPulse, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ROLE_LABELS } from '@/lib/auth/roles';

export function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => signOut()}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}

export function DashboardHeader() {
  const { profile, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <HeartPulse className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-foreground">
              RuralCare Connect
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              Dashboard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">
                {profile?.full_name ?? 'User'}
              </div>
              <div className="text-xs text-muted-foreground">
                {user?.email}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
              {profile ? ROLE_LABELS[profile.role] : 'Unknown'}
            </span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
