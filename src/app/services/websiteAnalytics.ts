export type WebsiteAnalyticsProperty = {
  id: string;
  name: string;
  domain: string;
  totals: {
    sessions: number;
    users: number;
    newUsers: number;
    pageviews: number;
    bounceRate: number;
    engagementRate: number;
    averageSessionDuration: number;
    pagesPerSession: number;
  };
  daily: Array<{ date: string; sessions: number; users: number; pageviews: number }>;
  sources: Array<{ channel: string; sourceMedium: string; sessions: number; users: number; engagedSessions: number }>;
  pages: Array<{ path: string; title: string; pageviews: number; users: number; engagementRate: number; averageSessionDuration: number }>;
  visitorTypes: Array<{ type: string; users: number; sessions: number }>;
  keywordPerformance: Array<{ keyword: string; page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  keywordWarning?: string;
};

export type WebsiteAnalyticsResponse = {
  startDate: string;
  endDate: string;
  properties: WebsiteAnalyticsProperty[];
  warnings?: string[];
};

export async function fetchWebsiteAnalytics(days = 30) {
  const response = await fetch(`/api/analytics/websites?days=${days}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Gagal mengambil data Google Analytics.");
  }

  return payload as WebsiteAnalyticsResponse;
}
