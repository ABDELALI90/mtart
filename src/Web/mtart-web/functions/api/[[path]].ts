import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_lib/env';
import { problem } from '../_lib/http';

const FORWARDED_HEADERS = new Set(['accept', 'accept-language', 'content-type', 'authorization']);

export const onRequest: PagesFunction<Env, 'path'> = async (context) => {
  const url = new URL(context.request.url);
  const instance = url.pathname;

  if (instance === '/api/v1/catalog' || instance.startsWith('/api/v1/catalog/')) {
    return problem(404, 'not_found', 'The requested resource was not found.', instance, 'notfound');
  }

  const base = context.env.RAILWAY_API_BASE_URL?.trim();
  if (!base) {
    return problem(
      503,
      'backend.unavailable',
      'The write API is not configured.',
      instance,
      'error',
    );
  }

  let target: URL;
  try {
    target = new URL(`${base.replace(/\/$/, '')}${url.pathname}${url.search}`);
  } catch {
    return problem(500, 'server_error', 'An unexpected error occurred.', instance);
  }

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return problem(500, 'server_error', 'An unexpected error occurred.', instance);
  }

  const headers = new Headers();
  for (const [key, value] of context.request.headers) {
    if (FORWARDED_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  try {
    const method = context.request.method.toUpperCase();
    const init: RequestInit = { method, headers };
    if (method !== 'GET' && method !== 'HEAD') {
      init.body = await context.request.arrayBuffer();
    }

    const upstream = await fetch(target, init);
    const responseHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('content-type', contentType);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return problem(502, 'backend.unavailable', 'The write API is temporarily unavailable.', instance, 'error');
  }
};
