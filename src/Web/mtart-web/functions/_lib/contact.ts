const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANGUAGES = new Set(['en', 'fr', 'es', 'ar']);
const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 8000;

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  language: string;
}

export function parseContactBody(body: unknown): { ok: true; value: ContactInput } | { ok: false; errors: Record<string, string[]> } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      errors: { body: ['A JSON object with name, email and message is required.'] },
    };
  }

  const record = body as Record<string, unknown>;
  const errors: Record<string, string[]> = {};
  const name = readString(record.name);
  const email = readString(record.email);
  const message = readString(record.message);
  const languageRaw = record.language === undefined || record.language === null ? '' : readString(record.language);

  if (!name) {
    errors.name = ['Name is required.'];
  } else if (name.length > MAX_NAME) {
    errors.name = ['Name is too long.'];
  }

  if (!email || !EMAIL_RE.test(email) || !email.includes('@')) {
    errors.email = ['A valid email is required.'];
  } else if (email.length > MAX_EMAIL) {
    errors.email = ['A valid email is required.'];
  }

  if (!message) {
    errors.message = ['Message is required.'];
  } else if (message.length > MAX_MESSAGE) {
    errors.message = ['Message is too long.'];
  }

  if (languageRaw && !LANGUAGES.has(languageRaw.toLowerCase())) {
    errors.language = ['Language must be en, fr, es or ar.'];
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      message,
      language: languageRaw ? languageRaw.toLowerCase() : 'en',
    },
  };
}

export function contactEmailPayload(input: ContactInput, from: string, to: string) {
  const submittedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const text = [
    'A new contact request was submitted from the MT ART website.',
    '',
    `Name: ${input.name}`,
    `Customer email: ${input.email}`,
    `Language: ${input.language}`,
    `Date/time (UTC): ${submittedAt} UTC`,
    '',
    'Message:',
    input.message,
  ].join('\n');

  return {
    from,
    to: [to],
    reply_to: input.email,
    subject: `New MT ART website request - ${input.name}`,
    text,
  };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
