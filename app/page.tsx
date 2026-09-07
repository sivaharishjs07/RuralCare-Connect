import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  ClipboardList,
  HeartPulse,
  Hospital,
  MapPin,
  Package,
  Stethoscope,
  Users,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────── */}
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
                Healthcare Coordination Platform
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <span className="text-sm font-medium text-muted-foreground">
              Stage 1 · Foundation
            </span>
            <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-xs font-semibold text-success">System Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute right-0 top-20 h-[300px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xs font-semibold tracking-wide text-primary">
                Improving Rural Healthcare Access
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              No patient left behind in the
              <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                healthcare journey
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              A coordination platform for rural and underserved communities —
              connecting patients, healthcare workers, and facilities through
              digital triage, closed-loop referrals, and continuous follow-up care.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Patient Journey ──────────────────────────────── */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              The Closed-Loop Care Journey
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Every patient is tracked from registration through follow-up — ensuring no one disappears after a referral.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {[
              { icon: Users, label: 'Registration', color: 'text-primary' },
              { icon: Activity, label: 'Triage', color: 'text-secondary' },
              { icon: Stethoscope, label: 'Consultation', color: 'text-accent' },
              { icon: ClipboardList, label: 'Referral', color: 'text-primary' },
              { icon: ArrowRight, label: 'In Progress', color: 'text-secondary' },
              { icon: Hospital, label: 'Arrived', color: 'text-accent' },
              { icon: HeartPulse, label: 'Care Complete', color: 'text-primary' },
              { icon: ClipboardList, label: 'Follow-up', color: 'text-secondary' },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className="group relative flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 text-center transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 transition-colors group-hover:bg-primary/10 ${step.color}`}>
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Built for Rural Healthcare Systems
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Comprehensive tools to coordinate care across facilities, workers, and patients.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Users,
              title: 'Patient Management',
              description: 'Register and track patients across facilities with centralized health records and demographics.',
            },
            {
              icon: Activity,
              title: 'Digital Triage',
              description: 'Structured severity assessment with vital signs capture and priority-based queueing.',
            },
            {
              icon: ClipboardList,
              title: 'Closed-Loop Referrals',
              description: 'Track every referral from creation through arrival and completion — no patient lost in transit.',
            },
            {
              icon: HeartPulse,
              title: 'Follow-Up Care',
              description: 'Schedule and monitor follow-up appointments to ensure care continuity after discharge.',
            },
            {
              icon: Package,
              title: 'Medicine Visibility',
              description: 'Real-time inventory tracking across facilities with stock-level alerts and medicine availability.',
            },
            {
              icon: Hospital,
              title: 'Facility Coordination',
              description: 'Connect clinics, hospitals, and health centers with unified scheduling and referral networks.',
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────── */}
      <section className="bg-gradient-to-r from-primary to-secondary">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { value: '12', label: 'Database Tables Ready' },
              { value: '8', label: 'Care Journey Steps' },
              { value: '6', label: 'Core Modules Planned' },
              { value: '100%', label: 'Closed-Loop Tracking' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-primary-foreground sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium text-primary-foreground/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <HeartPulse className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground">RuralCare Connect</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  Hackathon Project · Stage 1
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>Built for rural and underserved communities</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
