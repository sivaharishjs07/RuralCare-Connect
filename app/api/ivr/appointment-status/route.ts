npm import { NextResponse } from 'next/server';
import { getIvrLanguage, getIvrMessage } from '@/lib/ivr/messages';
import { assertIvrSecret, findPatientByPhone, getAppointmentContext, getPatientAppointments, IvrServiceError, normalisePhone } from '@/lib/ivr/server';

export async function POST(request: Request) {
  try {
    assertIvrSecret(request);
    const body = await request.json().catch(() => ({}));
    const language = getIvrLanguage(body.language);
    const phone = normalisePhone(body.phone);
    if (!phone) throw new IvrServiceError('invalid_request', getIvrMessage(language, 'invalidInput'));
    const patient = await findPatientByPhone(phone);
    const appointments = await getPatientAppointments(patient.id);
    if (!appointments.length) return NextResponse.json({ ok: true, language, prompt: 'noAppointments', message: getIvrMessage(language, 'noAppointments'), appointments: [] });
    const context = await getAppointmentContext(appointments);
    return NextResponse.json({
      ok: true,
      language,
      appointments: appointments.map((appointment) => ({
        appointmentDate: appointment.appointment_date,
        status: appointment.status,
        facility: appointment.facility_id ? context.facilities.get(appointment.facility_id) ?? null : null,
        doctor: appointment.doctor_id ? context.doctors.get(appointment.doctor_id) ?? null : null,
      })),
    });
  } catch (error) {
    const typed = error instanceof IvrServiceError ? error : new IvrServiceError('unavailable', 'Appointment status is unavailable.', 503);
    return NextResponse.json({ ok: false, code: typed.code, message: typed.message }, { status: typed.status });
  }
}
