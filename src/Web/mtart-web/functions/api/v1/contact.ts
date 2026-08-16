import type { PagesFunction } from '@cloudflare/workers-types';
import { contactEmailPayload, parseContactBody } from '../../_lib/contact';
import type { Env } from '../../_lib/env';
import { jsonNoStore, problem, safeError, validationProblem } from '../../_lib/http';

const RESEND_URL = 'https://api.resend.com/emails';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const instance = new URL(context.request.url).pathname;

  try {
    let raw: unknown;
    try {
      raw = await context.request.json();
    } catch {
      return validationProblem(instance, {
        body: ['A JSON object with name, email and message is required.'],
      });
    }

    const parsed = parseContactBody(raw);
    if (!parsed.ok) {
      return validationProblem(instance, parsed.errors);
    }

    const apiKey = context.env.RESEND_API_KEY?.trim();
    const toEmail = context.env.CONTACT_TO_EMAIL?.trim();
    const fromEmail = context.env.CONTACT_FROM_EMAIL?.trim();
    if (!apiKey || !toEmail || !fromEmail) {
      return problem(503, 'Unable to send the message.', 'Unable to send the message.', instance, 'error');
    }

    const payload = contactEmailPayload(parsed.value, fromEmail, toEmail);
    const upstream = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      return problem(503, 'Unable to send the message.', 'Unable to send the message.', instance, 'error');
    }

    return jsonNoStore({ sent: true });
  } catch {
    return safeError(instance);
  }
};
