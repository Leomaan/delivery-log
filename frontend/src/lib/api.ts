export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface Place {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface Price {
  id: number;
  placeId: number;
  unitCents: number;
  validFrom: string;
  validTo: string | null;
}

export interface Delivery {
  id: number;
  placeId: number;
  createdBy: number;
  date: string;
  quantity: number;
  unitCents: number;
  totalCents: number;
  canceledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface PaginatedDeliveries {
  items: Delivery[];
  page: number;
  limit: number;
  total: number;
  totalQuantity: number;
  totalDeliveredCents: number;
}

export interface PriceRateBreakdown {
  unitCents: number;
  totalQuantity: number;
  expectedAmountCents: number;
}

export interface PlaceReportSummary {
  placeId: number;
  placeName: string;
  totalQuantity: number;
  expectedAmountCents: number;
  rates: PriceRateBreakdown[];
}

export interface PeriodReportSummary {
  period: string;
  totalQuantity: number;
  expectedAmountCents: number;
}

export interface ReportSummary {
  totalQuantity: number;
  expectedAmountCents: number;
  byPlace: PlaceReportSummary[];
  byPeriod: PeriodReportSummary[];
}

class ApiClient {
  private accessToken: string | null = null;

  public setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const response = await fetch(`/api/v1${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && retry && !path.startsWith('/auth/')) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request<T>(path, init, false);
      }
    }

    if (!response.ok) {
      let errorMessage = 'Erro inesperado na comunicação com o servidor';
      try {
        const errBody = (await response.json()) as { message?: string };
        if (errBody.message) {
          errorMessage = errBody.message;
        }
      } catch {
        // Ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  public async tryRefresh(): Promise<{ accessToken: string; user: AuthUser } | null> {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        this.accessToken = null;
        return null;
      }
      const data = (await res.json()) as { accessToken: string; user: AuthUser };
      this.accessToken = data.accessToken;
      return data;
    } catch {
      this.accessToken = null;
      return null;
    }
  }

  public async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: AuthUser }> {
    const data = await this.request<{ accessToken: string; user: AuthUser }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    );
    this.accessToken = data.accessToken;
    return data;
  }

  public async logout(): Promise<void> {
    await this.request<unknown>(
      '/auth/logout',
      {
        method: 'POST',
      },
      false,
    );
    this.accessToken = null;
  }

  public async listPlaces(): Promise<{ items: Place[]; total: number }> {
    return this.request<{ items: Place[]; total: number }>('/places?limit=100');
  }

  public async createPlace(name: string): Promise<Place> {
    return this.request<Place>('/places', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  public async updatePlace(
    id: number,
    payload: { name?: string; active?: boolean },
  ): Promise<Place> {
    return this.request<Place>(`/places/${String(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async listPrices(placeId: number): Promise<{ items: Price[] }> {
    return this.request<{ items: Price[] }>(`/places/${String(placeId)}/prices`);
  }

  public async getActivePrice(placeId: number, date: string): Promise<Price | null> {
    try {
      return await this.request<Price>(
        `/places/${String(placeId)}/prices/active?date=${encodeURIComponent(date)}`,
      );
    } catch {
      return null;
    }
  }

  public async createPrice(
    placeId: number,
    payload: { unitCents: number; validFrom: string },
  ): Promise<Price> {
    return this.request<Price>(`/places/${String(placeId)}/prices`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async createDelivery(payload: {
    placeId: number;
    date: string;
    quantity: number;
  }): Promise<Delivery> {
    return this.request<Delivery>('/deliveries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async listDeliveries(params: {
    placeId?: number;
    from?: string;
    to?: string;
    includeCanceled?: boolean;
  }): Promise<PaginatedDeliveries> {
    const search = new URLSearchParams();
    search.set('limit', '100');
    if (params.placeId !== undefined) search.set('placeId', String(params.placeId));
    if (params.from) search.set('from', params.from);
    if (params.to) search.set('to', params.to);
    if (params.includeCanceled) search.set('includeCanceled', 'true');

    return this.request<PaginatedDeliveries>(`/deliveries?${search.toString()}`);
  }

  public async cancelDelivery(id: number, reason: string): Promise<Delivery> {
    return this.request<Delivery>(`/deliveries/${String(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public async getReportSummary(params: {
    placeId?: number;
    from?: string;
    to?: string;
    groupBy: 'day' | 'week' | 'month';
  }): Promise<ReportSummary> {
    const search = new URLSearchParams();
    search.set('groupBy', params.groupBy);
    if (params.placeId !== undefined) search.set('placeId', String(params.placeId));
    if (params.from) search.set('from', params.from);
    if (params.to) search.set('to', params.to);

    return this.request<ReportSummary>(`/reports/summary?${search.toString()}`);
  }
}

export const api = new ApiClient();
