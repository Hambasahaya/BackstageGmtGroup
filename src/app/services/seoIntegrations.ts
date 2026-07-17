import { getAuthToken } from "./api";

export type SeoKeywordResult = {
  keyword: string;
  searchVolume: number | null;
  cpcLow: number | null;
  cpcHigh: number | null;
  competition: string | null;
  competitionIndex: number | null;
  relatedKeywords: string[];
  trendPercent: number | null;
  gsc: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  } | null;
};

export type KeywordResearchResponse = {
  keywords: SeoKeywordResult[];
  meta: {
    startDate: string;
    endDate: string;
    siteUrl: string;
    adsApiVersion: string;
    sources: string[];
  };
};

export async function fetchKeywordResearch(input: {
  keywords: string;
  siteUrl?: string;
  startDate?: string;
  endDate?: string;
}) {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/seo/keyword-research", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Keyword research request failed.");
  }

  return payload as KeywordResearchResponse;
}
