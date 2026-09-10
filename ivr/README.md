# IVR integration

This module exposes an Asterisk-compatible HTTP API without changing the browser portals, Supabase browser client, IndexedDB, or existing offline queue.

## Architecture

Asterisk collects DTMF and sends JSON over HTTPS to the Next.js routes under `/api/ivr`. The server validates the shared secret, looks up the patient by registered phone number, validates booking options against Supabase, and creates or reads only that patient's appointments. Supabase service-role access is server-only and is never sent to Asterisk or the browser.

The selected language is returned by `/api/ivr/session` and must be retained by the Asterisk channel as `${LANGUAGE}` for the rest of the call.

## Required environment variables

Add these only to the application server environment, never to browser code or a committed dialplan:

```env
IVR_SHARED_SECRET=replace-with-a-long-random-value
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

`NEXT_PUBLIC_SUPABASE_URL` is already used by the application. Restart the Next.js server after adding the variables. The API returns HTTP 503 with `code: "unavailable"` when the IVR server configuration is incomplete.

## Routes

All routes require the `x-ivr-secret` header and JSON requests.

- `POST /api/ivr/session`: accepts `{ "language": "en" }`, returns a call `sessionId`, language prompt, and main-menu prompt.
- `POST /api/ivr/menu`: accepts `{ "language": "en", "dtmf": "1" }`; returns `book_appointment`, `appointment_status`, `healthcare_information`, `repeat_menu`, or `hangup`.
- `POST /api/ivr/appointment`: accepts `{ "language": "en", "phone": "...", "date": "DDMMYYYY", "time": "09:00", "facilityId": "...", "doctorId": "..." }`. Facility and doctor IDs are optional and are accepted only when they exist.
- `POST /api/ivr/appointment-status`: accepts `{ "language": "en", "phone": "..." }` and returns up to five appointments for that patient.
- `POST /api/ivr/information`: accepts `{ "language": "en", "dtmf": "1" }` for general guidance, medication reminders, or emergency guidance.

Example with PowerShell:

```powershell
$headers = @{ 'x-ivr-secret' = $env:IVR_SHARED_SECRET }
$body = @{ language = 'en'; phone = '+919999999999'; date = '25092026'; time = '09:00' } | ConvertTo-Json
Invoke-RestMethod "$env:IVR_API_URL/api/ivr/appointment" -Method Post -Headers $headers -ContentType 'application/json' -Body $body
```

Do not use a patient ID supplied by the caller. The API identifies the patient using the registered phone number and then queries appointments by the validated patient row.

## Asterisk demo

1. Install Asterisk separately using the official package for your operating system or a local Linux VM. This repository does not install or modify Asterisk.
2. Copy `ivr/extensions.conf.example` into your Asterisk configuration and adapt the context/include for your local installation.
3. Provide `IVR_API_URL` and `IVR_SHARED_SECRET` to the Asterisk runtime. Do not hard-code the secret in a committed file.
4. Add the audio files referenced by the example (`ivr/language-menu`, `ivr/main-menu`, and so on), or replace them with your own prompts. The API also returns text and prompt identifiers for development.
5. Reload the dialplan and call extension `100` from a local SIP/VoIP client.

The example keeps language in the channel variable `${LANGUAGE}` and uses DTMF: 1 English, 2 Hindi, 3 Marathi; main menu 1 booking, 2 status, 3 information, 9 repeat, 0 hang up.

The example uses `curl` to demonstrate the HTTP calls. A small AGI helper should parse the JSON response and select the returned `message` or `prompt` before playing audio. Do not write API responses containing personal data to permanent logs.

## Limitations

Asterisk is free and open source, but connecting to real mobile/PSTN numbers may require a SIP trunk or telephony provider and may incur charges. This initial prototype uses a registered phone number as the patient identifier, so phone-number verification and rate limiting should be added before production use. If Supabase is unavailable, the API returns a structured error and does not claim that an appointment was booked; it does not use or modify browser IndexedDB offline data.
