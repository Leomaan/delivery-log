import { translateApiErrorMessage } from '../utils/error';

const API_BASE = '/api/v1';
const DEFAULT_CACHE_TTL_MS = 60_000;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

class HttpClient {
  private cache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<unknown>>();
  private refreshPromise: Promise<boolean> | null = null;

  public invalidateCache(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  private async tryRefreshCookies(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(path: string, init: RequestInit = {}, retryOn401 = true): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

    if (res.status === 401 && retryOn401 && !path.startsWith('/auth/')) {
      const refreshed = await this.tryRefreshCookies();
      if (refreshed) {
        return this.request<T>(path, init, false);
      }
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const data = (await res.json()) as T & { message?: string };
    if (!res.ok) {
      throw new Error(translateApiErrorMessage(data.message, res.status));
    }

    return data;
  }

  public async get<T>(path: string, ttlMs = DEFAULT_CACHE_TTL_MS): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(path);
    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }

    const pending = this.inFlight.get(path);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = this.request<T>(path, { method: 'GET' })
      .then((res) => {
        this.cache.set(path, { data: res, expiresAt: Date.now() + ttlMs });
        this.inFlight.delete(path);
        return res;
      })
      .catch((err: unknown) => {
        this.inFlight.delete(path);
        throw err;
      });

    this.inFlight.set(path, promise);
    return promise;
  }

  public async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public async delete(path: string): Promise<void> {
    await this.request<unknown>(path, {
      method: 'DELETE',
    });
  }
}

export const httpClient = new HttpClient();
