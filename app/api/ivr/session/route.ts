import { NextResponse } from 'next/server';
import { assertIvrSecret, IvrServiceError } from '@/lib/ivr/server';
import { getIvrLanguage, getIvrMessage } from '@/lib/ivr/messages';

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json({ ok: status < 400, ...body }, { status });
}

export async function POST(request: Request) {
  try {
    assertIvrSecret(request);
    const body = await request.json().catch(() => ({}));
    const language = getIvrLanguage(body.language);
    return response({ sessionId: crypto.randomUUID(), language, prompt: 'languageMenu', message: getIvrMessage(language, 'languageMenu'), nextPrompt: 'mainMenu', nextMessage: getIvrMessage(language, 'mainMenu') });
  } catch (error) {
    if (error instanceof IvrServiceError) return response({ code: error.code, message: error.message }, error.status);
    return response({ code: 'invalid_request', message: 'Invalid IVR request.' }, 400);
  }
}
