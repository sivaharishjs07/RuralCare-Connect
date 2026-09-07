'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, HeartPulse } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PatientLanguageProvider } from '@/lib/i18n/patient-language';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session, loading, profile, profileError } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-md">
          <HeartPulse className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading your session...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (profileError && !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning shadow-md">
          <HeartPulse className="h-6 w-6 text-warning-foreground" strokeWidth={2.5} />
        </div>
        <div className="max-w-md text-center">
          <h2 className="text-lg font-bold text-foreground">Profile Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">{profileError}</p>
        </div>
      </div>
    );
  }

  return (
    <PatientLanguageProvider>
      <DashboardShell>{children}</DashboardShell>
    </PatientLanguageProvider>
  );
}
