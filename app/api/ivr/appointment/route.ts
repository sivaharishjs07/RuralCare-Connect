import { NextResponse } from 'next/server';
import { getIvrLanguage, getIvrMessage } from '@/lib/ivr/messages';
import { assertIvrSecret, createAppointment, findPatientByPhone, IvrServiceError, listBookingOptions, normalisePhone, parseDate } from '@/lib/ivr/server';

export async function POST(request: Request) {
  try {
    assertIvrSecret(request);
    const body = await request.json().catch(() => ({}));
    const language = getIvrLanguage(body.language);
    const phone = normalisePhone(body.phone);
    const date = parseDate(body.date);
    if (!phone || !date) throw new IvrServiceError('invalid_request', getIvrMessage(language, 'invalidInput'));
    const patient = await findPatientByPhone(phone);
    const options = await listBookingOptions();
    const facilityId = typeof body.facilityId === 'string' && options.facilities.some((item) => item.id === body.facilityId) ? body.facilityId : null;
    const doctorId = typeof body.doctorId === 'string' && options.doctors.some((item) => item.id === body.doctorId) ? body.doctorId : null;
    const time = typeof body.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.time) ? body.time : '09:00';
    const appointment = await createAppointment({ patientId: patient.id, appointmentDate: `${date}T${time}:00.000Z`, facilityId, doctorId });
    return NextResponse.json({ ok: true, language, prompt: 'appointmentCreated', message: getIvrMessage(language, 'appointmentCreated'), appointment: { id: appointment.id, appointmentDate: appointment.appointment_date, status: appointment.status } });
  } catch (error) {
    const typed = error instanceof IvrServiceError ? error : new IvrServiceError('unavailable', 'Appointment service is unavailable.', 503);
    return NextResponse.json({ ok: false, code: typed.code, message: typed.message }, { status: typed.status });
  }
}
