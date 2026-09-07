import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth/auth-context';
import { PwaRegistration } from '@/components/layout/pwa-registration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://ruralcare-connect.app'),
  title: 'RuralCare Connect — Healthcare Coordination Platform',
  description:
    'A healthcare coordination platform improving access and continuity of care for rural and underserved communities through digital triage, closed-loop referrals, and follow-up tracking.',
  openGraph: {
    title: 'RuralCare Connect',
    description:
      'Improving accessibility and quality of public healthcare services in rural and underserved areas.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <PwaRegistration />
        <Toaster />
      </body>
    </html>
  );
}
