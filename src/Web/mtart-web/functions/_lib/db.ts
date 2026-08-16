export async function all<T>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<T>();
  return result.results ?? [];
}

export async function first<T>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const row = await db
    .prepare(sql)
    .bind(...params)
    .first<T>();
  return row ?? null;
}

export function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}
