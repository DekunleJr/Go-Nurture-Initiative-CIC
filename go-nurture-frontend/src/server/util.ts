export const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
export const toCamel = (s: string) => s.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());

/** Convert a DB row (camelCase keys) to the snake_case JSON the frontend expects. */
export function snakeRow<T extends object>(row: T, omit: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (omit.includes(k)) continue;
    out[toSnake(k)] = v;
  }
  return out;
}

/** Convert snake_case request fields to camelCase, keeping only allow-listed keys. */
export function camelPick(input: Record<string, unknown>, allowed?: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue;
    if (allowed && !allowed.includes(k)) continue;
    out[toCamel(k)] = v;
  }
  return out;
}

export const nowUtc = () => new Date();
