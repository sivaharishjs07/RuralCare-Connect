'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Clock3, Loader2, Phone, PhoneCall, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Language = 'en' | 'hi' | 'mr';
type Screen = 'idle' | 'main' | 'booking-phone' | 'booking-date' | 'booking-time' | 'status-phone' | 'info-menu' | 'ended';

type SessionResponse = {
  ok?: boolean;
  message?: string;
  nextMessage?: string;
  prompt?: string;
  language?: Language;
  sessionId?: string;
  action?: string;
  code?: string;
  appointments?: Array<{
    appointmentDate?: string;
    status?: string | null;
    facility?: string | null;
    doctor?: string | null;
  }>;
  appointment?: {
    id?: string;
    appointmentDate?: string;
    status?: string | null;
  };
};

const languageOptions: Array<{ value: Language; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'mr', label: 'मराठी' },
];

const formatToDdMmYyyy = (value: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
};

const isValidPhone = (value: string) => /^\+?[0-9]{7,15}$/.test(value.replace(/\s+/g, ''));

export default function IvrSimulatorPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [screen, setScreen] = useState<Screen>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Press Start IVR Call to begin the simulated call.');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [appointmentDateInput, setAppointmentDateInput] = useState('');
  const [appointmentTimeInput, setAppointmentTimeInput] = useState('');
  const [appointments, setAppointments] = useState<SessionResponse['appointments']>([]);

  const statusText = useMemo(() => {
    if (screen === 'idle') return 'Call ready';
    if (screen === 'ended') return 'Call ended';
    if (screen === 'main') return 'Main menu';
    if (screen === 'booking-phone') return 'Book appointment: phone';
    if (screen === 'booking-date') return 'Book appointment: date';
    if (screen === 'booking-time') return 'Book appointment: time';
    if (screen === 'status-phone') return 'Appointment status';
    if (screen === 'info-menu') return 'Healthcare information';
    return 'IVR session';
  }, [screen]);

  const callSimulator = async (action: string, payload: Record<string, unknown> = {}) => {
    setIsLoading(true);
    setError(null);

    const response = await fetch('/api/ivr/simulator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = (await response.json()) as SessionResponse;
    setIsLoading(false);

    if (!response.ok || data.ok === false) {
      const apiMessage = data.message ?? 'IVR request failed.';
      setError(apiMessage);
      return null;
    }

    return data;
  };

  const resetFormState = () => {
    setPhoneInput('');
    setAppointmentDateInput('');
    setAppointmentTimeInput('');
    setAppointments([]);
  };

  const startCall = async () => {
    resetFormState();
    const result = await callSimulator('session', { language });
    if (!result) return;

    setSessionId(result.sessionId ?? null);
    setScreen('main');
    setMessage(result.message ?? result.nextMessage ?? 'Language menu loaded.');
  };

  const handleMainMenuDigit = async (dtmf: string) => {
    if (!sessionId && screen !== 'main') {
      setError('Start the IVR session first.');
      return;
    }

    const result = await callSimulator('menu', { language, dtmf });
    if (!result) return;

    if (result.action === 'repeat_menu') {
      setScreen('main');
      setMessage(result.message ?? 'Main menu repeated.');
      return;
    }

    if (result.action === 'hangup') {
      endCall();
      return;
    }

    if (result.action === 'book_appointment') {
      setScreen('booking-phone');
      setMessage('Please enter the registered phone number.');
      setError(null);
      return;
    }

    if (result.action === 'appointment_status') {
      setScreen('status-phone');
      setMessage('Please enter the registered phone number to check appointment status.');
      setError(null);
      return;
    }

    if (result.action === 'healthcare_information') {
      setScreen('info-menu');
      setMessage(result.message ?? 'Healthcare information menu loaded.');
      return;
    }

    setMessage(result.message ?? 'Main menu updated.');
  };

  const handleInformationChoice = async (dtmf: string) => {
    const result = await callSimulator('information', { language, dtmf });
    if (!result) return;

    setMessage(result.message ?? 'Healthcare guidance loaded.');
    setScreen('main');
  };

  const handleStatusSubmit = async () => {
    if (!isValidPhone(phoneInput)) {
      setError('Please enter a valid registered phone number.');
      return;
    }

    const result = await callSimulator('appointment-status', { language, phone: phoneInput.replace(/\s+/g, '') });
    if (!result) return;

    if (result.appointments && result.appointments.length > 0) {
      setAppointments(result.appointments);
      setMessage('Appointment status returned successfully.');
      setError(null);
    } else {
      setAppointments([]);
      setMessage(result.message ?? 'No appointments found for this registered phone number.');
      setError(null);
    }

    setScreen('main');
  };

  const handleBookingPhoneSubmit = () => {
    if (!isValidPhone(phoneInput)) {
      setError('Please enter a valid registered phone number.');
      return;
    }

    setError(null);
    setScreen('booking-date');
    setMessage('Please enter the preferred appointment date.');
  };

  const handleBookingDateSubmit = () => {
    const ddmmyyyy = formatToDdMmYyyy(appointmentDateInput);
    if (!ddmmyyyy) {
      setError('Please enter a valid appointment date.');
      return;
    }

    setError(null);
    setScreen('booking-time');
    setMessage('Please enter the preferred appointment time in HH:MM format.');
  };

  const handleBookingTimeSubmit = async () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(appointmentTimeInput)) {
      setError('Please enter a valid time in HH:MM format.');
      return;
    }

    const ddmmyyyy = formatToDdMmYyyy(appointmentDateInput);
    if (!ddmmyyyy) {
      setError('Please enter a valid appointment date first.');
      setScreen('booking-date');
      return;
    }

    const result = await callSimulator('appointment', {
      language,
      phone: phoneInput.replace(/\s+/g, ''),
      date: ddmmyyyy,
      time: appointmentTimeInput,
    });

    if (!result) return;

    setMessage(result.message ?? 'Appointment booking request returned successfully.');
    setError(null);
    setScreen('main');
  };

  const endCall = () => {
    setScreen('ended');
    setMessage('The simulated call has ended. Press Start IVR Call to begin again.');
    resetFormState();
    setSessionId(null);
    setError(null);
  };

  const showKeypad = screen === 'main' || screen === 'info-menu';

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/30">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PhoneCall className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">IVR Simulator</CardTitle>
                  <CardDescription>Simulated voice call flow for appointment and healthcare services.</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="ivr-language" className="text-sm font-medium text-foreground">Language</label>
                <select
                  id="ivr-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as Language)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      {statusText}
                    </span>
                    {sessionId && <span className="text-xs text-muted-foreground">Session {sessionId.slice(0, 8)}</span>}
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background p-4 text-sm leading-relaxed text-foreground">
                    {message}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {screen === 'idle' && (
                  <div className="flex justify-start">
                    <Button type="button" onClick={() => void startCall()} disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneCall className="mr-2 h-4 w-4" />}
                      Start IVR Call
                    </Button>
                  </div>
                )}

                {screen === 'main' && showKeypad && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                        <Button
                          key={digit}
                          type="button"
                          variant="outline"
                          className="h-14 text-lg font-semibold"
                          onClick={() => void handleMainMenuDigit(digit)}
                          disabled={isLoading}
                        >
                          {digit}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button type="button" variant="outline" className="h-12" onClick={() => void handleMainMenuDigit('9')} disabled={isLoading}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Repeat
                      </Button>
                      <Button type="button" variant="destructive" className="h-12" onClick={endCall} disabled={isLoading}>
                        <ShieldAlert className="mr-2 h-4 w-4" /> End call
                      </Button>
                    </div>
                  </div>
                )}

                {screen === 'info-menu' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {['1', '2', '3'].map((digit) => (
                        <Button
                          key={digit}
                          type="button"
                          variant="outline"
                          className="h-14 text-lg font-semibold"
                          onClick={() => void handleInformationChoice(digit)}
                          disabled={isLoading}
                        >
                          {digit}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button type="button" variant="outline" className="h-12" onClick={() => void handleMainMenuDigit('9')} disabled={isLoading}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Repeat menu
                      </Button>
                      <Button type="button" variant="destructive" className="h-12" onClick={endCall} disabled={isLoading}>
                        End call
                      </Button>
                    </div>
                  </div>
                )}

                {(screen === 'booking-phone' || screen === 'status-phone') && (
                  <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      Registered phone number
                    </div>
                    <Input
                      type="tel"
                      value={phoneInput}
                      onChange={(event) => setPhoneInput(event.target.value)}
                      placeholder="e.g. +91 98765 43210"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (screen === 'booking-phone') handleBookingPhoneSubmit();
                        else handleStatusSubmit();
                      }}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {screen === 'booking-date' && (
                  <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Preferred appointment date
                    </div>
                    <Input type="date" value={appointmentDateInput} onChange={(event) => setAppointmentDateInput(event.target.value)} />
                    <Button type="button" onClick={handleBookingDateSubmit}>Continue</Button>
                  </div>
                )}

                {screen === 'booking-time' && (
                  <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Preferred appointment time
                    </div>
                    <Input type="time" value={appointmentTimeInput} onChange={(event) => setAppointmentTimeInput(event.target.value)} />
                    <Button type="button" onClick={() => void handleBookingTimeSubmit()}>Book appointment</Button>
                  </div>
                )}

                {screen === 'ended' && (
                  <div className="flex justify-start">
                    <Button type="button" onClick={() => void startCall()} disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneCall className="mr-2 h-4 w-4" />}
                      Start IVR Call
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">IVR Menu</h3>
                  <ul className="mt-4 space-y-2 text-sm text-foreground">
                    <li>1: Book appointment</li>
                    <li>2: Check appointment status</li>
                    <li>3: Healthcare information</li>
                    <li>9: Repeat menu</li>
                    <li>0: End call</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Healthcare info</h3>
                  <ul className="mt-4 space-y-2 text-sm text-foreground">
                    <li>1: General health guidance</li>
                    <li>2: Medication reminders</li>
                    <li>3: Emergency guidance</li>
                  </ul>
                </div>

                {appointments.length > 0 && (
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Appointments</h3>
                    <div className="mt-3 space-y-3">
                      {appointments.map((appointment, index) => (
                        <div key={`${appointment.appointmentDate ?? index}-${index}`} className="rounded-lg border border-border/70 bg-background p-3 text-sm">
                          <p className="font-semibold text-foreground">{appointment.appointmentDate ?? 'Unknown date'}</p>
                          <p className="mt-1 text-muted-foreground">Status: {appointment.status ?? 'Unknown'}</p>
                          <p className="text-muted-foreground">Facility: {appointment.facility ?? 'Not assigned'}</p>
                          <p className="text-muted-foreground">Doctor: {appointment.doctor ?? 'Not assigned'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
