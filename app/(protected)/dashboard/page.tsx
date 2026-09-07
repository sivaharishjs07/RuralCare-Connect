'use client';

import {
  Activity,
  ClipboardList,
  HeartPulse,
  Hospital,
  Package,
  Users,
  Bell,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/auth/roles';

export default function DashboardPage() {
  const { profile, user } = useAuth();

  if (!profile) return null;

  const platformModules = [
    {
      icon: Users,
      label: 'Patient Management',
      description: 'Register, search and manage patient records',
      href: '/patients',
      color: 'text-primary',
    },
    {
      icon: Activity,
      label: 'Digital Triage',
      description: 'Assess patient symptoms and risk levels',
      href: '/triage',
      color: 'text-secondary',
    },
    {
      icon: CalendarDays,
      label: 'Appointments & Queue',
      description: 'Manage appointments and patient queues',
      href: '/appointments',
      color: 'text-accent',
    },
    {
      icon: ClipboardList,
      label: 'Closed-Loop Referrals',
      description: 'Track referrals from creation to completion',
      href: '/referrals',
      color: 'text-primary',
    },
    {
      icon: HeartPulse,
      label: 'Follow-Up Care',
      description: 'Track scheduled patient follow-ups and outcomes',
      href: '/follow-ups',
      color: 'text-secondary',
    },
    {
      icon: Package,
      label: 'Medicine Inventory',
      description: 'Monitor medicine availability and stock levels',
      href: '/medicines',
      color: 'text-accent',
    },
    {
      icon: Hospital,
      label: 'Facility Coordination',
      description: 'View healthcare facilities and coordination details',
      href: '/facilities',
      color: 'text-primary',
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'View your healthcare system notifications',
      href: '/notifications',
      color: 'text-secondary',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Welcome banner */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-primary to-secondary p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
              <HeartPulse
                className="h-6 w-6 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-primary-foreground sm:text-2xl">
                Welcome, {profile.full_name}
              </h1>

              <p className="mt-0.5 text-sm text-primary-foreground/80">
                You are signed in as {ROLE_LABELS[profile.role]}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/80">
            {ROLE_DESCRIPTIONS[profile.role]}
          </p>
        </div>

        {/* Session information */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Logged in as
            </div>

            <div className="mt-1.5 text-sm font-semibold text-foreground">
              {user?.email}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Role
            </div>

            <div className="mt-1.5 text-sm font-semibold text-primary">
              {ROLE_LABELS[profile.role]}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Language
            </div>

            <div className="mt-1.5 text-sm font-semibold text-foreground">
              {profile.language ?? 'English'}
            </div>
          </div>
        </div>

        {/* Platform modules */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">
            Platform Modules
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Access the healthcare coordination modules available in RuralCare Connect.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {platformModules.map((mod) => {
            const Icon = mod.icon;

            return (
              <Link
                key={mod.label}
                href={mod.href}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 ${mod.color}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>

                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Available
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground">
                  {mod.label}
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {mod.description}
                </p>

                <div className="mt-4 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open module →
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            RuralCare Connect · Integrated Rural Healthcare Coordination Platform
          </p>
        </div>
      </main>
    </div>
  );
}