let seq = 0;

export function nanoidLike(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}`;
}

export function nextZoneId(existing: string[]): string {
  const used = new Set(existing);
  let index = 1;
  while (used.has(`zone-${index}`)) {
    index += 1;
  }
  return `zone-${index}`;
}
