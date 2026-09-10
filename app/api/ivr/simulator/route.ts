import { NextResponse } from 'next/server';

const actionMap = {
  session: 'session',
  menu: 'menu',
  appointment: 'appointment',
  'appointment-status': 'appointment-status',
  information: 'information',
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';
    const endpoint = actionMap[action as keyof typeof actionMap];

    if (!endpoint) {
      return NextResponse.json(
        { ok: false, code: 'invalid_request', message: 'Unknown IVR simulator action.' },
        { status: 400 }
      );
    }

    const secret = process.env.IVR_SHARED_SECRET;
    if (!secret) {
      return NextResponse.json(
        { ok: false, code: 'unavailable', message: 'IVR shared secret is not configured.' },
        { status: 503 }
      );
    }

    const payload = body.payload && typeof body.payload === 'object' ? body.payload : body;
    const safePayload = { ...payload };
    delete (safePayload as Record<string, unknown>).action;

    const target = new URL(`/api/ivr/${endpoint}`, request.url);
    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ivr-secret': secret,
      },
      body: JSON.stringify(safePayload),
    });

    const json = await response.json().catch(() => ({}));
    return NextResponse.json(json, { status: response.status });
  } catch {
    return NextResponse.json(
      { ok: false, code: 'invalid_request', message: 'Invalid IVR simulator request.' },
      { status: 400 }
    );
  }
}
