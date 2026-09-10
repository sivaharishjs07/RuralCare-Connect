import { NextResponse } from 'next/server';
import { getIvrLanguage, getIvrMessage } from '@/lib/ivr/messages';
import { assertIvrSecret, IvrServiceError } from '@/lib/ivr/server';

const informationKeys = { '1': 'generalHealth', '2': 'medication', '3': 'emergency' } as const;

export async function POST(request: Request) {
  try {
    assertIvrSecret(request);
    const body = await request.json().catch(() => ({}));
    const language = getIvrLanguage(body.language);
    const key = typeof body.dtmf === 'string' ? informationKeys[body.dtmf as keyof typeof informationKeys] : undefined;
    if (!key) throw new IvrServiceError('invalid_request', getIvrMessage(language, 'invalidInput'));
    return NextResponse.json({ ok: true, language, prompt: key, message: getIvrMessage(language, key), action: 'return_to_main_menu' });
  } catch (error) {
    const typed = error instanceof IvrServiceError ? error : new IvrServiceError('invalid_request', 'Invalid IVR request.');
    return NextResponse.json({ ok: false, code: typed.code, message: typed.message }, { status: typed.status });
  }
}
