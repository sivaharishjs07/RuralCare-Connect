import { NextResponse } from 'next/server';
import { getIvrLanguage, getIvrMessage } from '@/lib/ivr/messages';
import { assertIvrSecret, IvrServiceError } from '@/lib/ivr/server';

export async function POST(request: Request) {
  try {
    assertIvrSecret(request);
    const body = await request.json().catch(() => ({}));
    const language = getIvrLanguage(body.language);
    const input = typeof body.dtmf === 'string' ? body.dtmf : '';
    if (!['1', '2', '3', '9', '0'].includes(input)) throw new IvrServiceError('invalid_request', getIvrMessage(language, 'invalidInput'));
    if (input === '0') return NextResponse.json({ ok: true, action: 'hangup', language });
    if (input === '9') return NextResponse.json({ ok: true, action: 'repeat_menu', language, prompt: 'mainMenu', message: getIvrMessage(language, 'mainMenu') });
    const action = input === '1' ? 'book_appointment' : input === '2' ? 'appointment_status' : 'healthcare_information';
    return NextResponse.json({ ok: true, action, language, prompt: action === 'book_appointment' ? 'bookIntro' : action === 'appointment_status' ? 'statusIntro' : 'informationMenu', message: getIvrMessage(language, action === 'book_appointment' ? 'bookIntro' : action === 'appointment_status' ? 'statusIntro' : 'informationMenu') });
  } catch (error) {
    const typed = error instanceof IvrServiceError ? error : new IvrServiceError('invalid_request', 'Invalid IVR request.');
    return NextResponse.json({ ok: false, code: typed.code, message: typed.message }, { status: typed.status });
  }
}
