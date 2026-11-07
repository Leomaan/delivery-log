export type ActiveTab = 'deliveries' | 'reports' | 'places';

export type PeriodMode = 'month' | 'week' | 'day' | 'year' | 'all' | 'custom';

export interface AuthUser {
  id: number;
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
  createdAt: string;
}

export interface PaginatedDeliveries {
  items: Delivery[];
  total: number;
  page: number;
  limit: number;
  totalQuantity: number;
  totalDeliveredCents: number;
}

export interface PriceRateBreakdownItem {
  unitCents: number;
  totalQuantity: number;
  expectedAmountCents: number;
}

export interface PlaceReportSummaryItem {
  placeId: number;
  placeName: string;
  totalQuantity: number;
  expectedAmountCents: number;
  rates: PriceRateBreakdownItem[];
}

export interface PeriodReportSummaryItem {
  period: string;
  totalQuantity: number;
  expectedAmountCents: number;
}

export interface ReportSummary {
  totalQuantity: number;
  expectedAmountCents: number;
  byPlace: PlaceReportSummaryItem[];
  byPeriod: PeriodReportSummaryItem[];
}

export interface FeedbackMessage {
  type: 'success' | 'error';
  text: string;
}
