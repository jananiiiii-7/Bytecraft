export class CacheService {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(private readonly ttlSeconds = 300) {}

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}
