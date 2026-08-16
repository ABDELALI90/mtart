const PROBLEM_BASE = 'https://mtart.example.com/problems';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=30',
    },
  });
}

export function problem(
  status: number,
  title: string,
  detail: string,
  instance: string,
  type = status === 404 ? 'notfound' : status === 400 ? 'validation' : 'error',
): Response {
  return new Response(
    JSON.stringify({
      type: `${PROBLEM_BASE}/${type}`,
      title,
      status,
      detail,
      instance,
    }),
    {
      status,
      headers: {
        'content-type': 'application/problem+json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}

export function bindError(instance: string, field: string, value: string): Response {
  return new Response(
    JSON.stringify({
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      instance,
      errors: {
        [field]: [`The value '${value}' is not valid.`],
      },
    }),
    {
      status: 400,
      headers: {
        'content-type': 'application/problem+json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}

export function safeError(instance: string): Response {
  return problem(500, 'server_error', 'An unexpected error occurred.', instance, 'error');
}
