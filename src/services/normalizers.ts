function pickValue<T = unknown>(record: Record<string, unknown>, keys: string[], fallback?: T): T | undefined {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key] as T;
    }
  }

  return fallback;
}

export function pickString(record: Record<string, unknown>, keys: string[], fallback = ''): string {
  const value = pickValue(record, keys, fallback);
  return typeof value === 'string' ? value : fallback;
}

export function pickNumber(record: Record<string, unknown>, keys: string[], fallback = 0): number {
  const value = pickValue(record, keys, fallback);
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function pickNullableString(record: Record<string, unknown>, keys: string[]): string | undefined {
  const value = pickValue(record, keys);
  return typeof value === 'string' ? value : undefined;
}

