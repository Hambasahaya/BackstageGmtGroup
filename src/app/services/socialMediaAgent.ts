import type { InstagramInsights } from "./metaIntegrations";

const baseUrl = (import.meta.env.VITE_SOSMED_AGENT_BASE_URL || "").replace(/\/$/, "");
const timeoutMs = 60_000;

export type SocialAgentAccount = { id: string; ig_user_id: string; username: string; name?: string | null };
export type SocialAgentBundle = {
  account: SocialAgentAccount;
  dashboard: any;
  demographics: any;
  summary: { summary?: string; key_points?: string[] };
  sentiment: {
    sentiment?: { positive?: number; neutral?: number; negative?: number };
    keywords?: string[];
    suggested_hashtags?: string[];
    summary?: string;
    analyzed_comments_count?: number;
  };
  reasoning: { data: Array<Record<string, any>> };
};

export const isSocialAgentConfigured = () => Boolean(baseUrl);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new Error("VITE_SOSMED_AGENT_BASE_URL belum dikonfigurasi.");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.detail || payload?.error || `Social Media Agent error (${response.status}).`);
    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Social Media Agent melewati batas waktu 60 detik.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

const metric = (media: InstagramInsights["media"][number], name: string) => {
  const value = media.insights?.data?.find((item) => item.name === name)?.values?.at(-1)?.value;
  return typeof value === "number" ? value : 0;
};
const toRecord = (items?: Array<{ label: string; value: number }>) =>
  Object.fromEntries((items || []).map((item) => [item.label, item.value]));

export function buildHourlySyncPayload(data: InstagramInsights) {
  const profile = data.profile;
  if (!profile?.id || !profile.username) throw new Error("Profil Instagram belum lengkap untuk sinkronisasi.");
  const media = data.media.map((item) => ({
    ig_media_id: item.id,
    caption: item.caption || null,
    media_type: item.media_type || "UNKNOWN",
    media_product_type: item.media_product_type || "FEED",
    permalink: item.permalink || null,
    posted_at: item.timestamp || new Date().toISOString(),
    like_count: item.like_count || 0,
    comments_count: item.comments_count || 0,
    insights: {
      reach: metric(item, "reach"),
      views: metric(item, "views"),
      saved: metric(item, "saved") || metric(item, "saves"),
      shares: metric(item, "shares"),
      total_interactions: metric(item, "total_interactions"),
      ig_reels_avg_watch_time: metric(item, "ig_reels_avg_watch_time") || null,
      ig_reels_video_view_total_time: metric(item, "ig_reels_video_view_total_time") || null,
      replies: metric(item, "replies") || null,
    },
    comments: (item.comments?.data || []).map((comment) => ({
      ig_comment_id: comment.id,
      text: comment.text,
      username: comment.username || null,
      created_at: comment.timestamp || null,
    })),
  }));
  return {
    ig_user_id: profile.id,
    username: profile.username,
    profile: {
      followers_count: profile.followers_count || 0,
      follows_count: profile.follows_count || 0,
      media_count: profile.media_count || 0,
      biography: profile.biography || null,
      profile_picture_url: profile.profile_picture_url || null,
      website: profile.website || null,
    },
    media_list: media.filter((item) => item.media_product_type !== "STORY"),
    stories_list: media.filter((item) => item.media_product_type === "STORY"),
    demographics: {
      age_gender: toRecord(data.audience?.demographics?.age),
      city: toRecord(data.audience?.demographics?.city),
      country: toRecord(data.audience?.demographics?.country),
      online_followers: toRecord(data.audience?.onlineFollowers),
    },
    account_insights: data.insights.flatMap((item) =>
      item.values.map((point) => ({
        metric: item.name,
        value: typeof point.value === "number" ? point.value : 0,
        period: item.period || "day",
        end_time: point.end_time || undefined,
      })),
    ),
  };
}

export async function syncAndFetchSocialAgent(
  data: InstagramInsights,
  range: { since: string; until: string },
): Promise<SocialAgentBundle> {
  await request("/api/sync/store-hourly", { method: "POST", body: JSON.stringify(buildHourlySyncPayload(data)) });
  const accounts = await request<SocialAgentAccount[]>("/api/accounts");
  const account = accounts.find((item) => item.ig_user_id === data.profile?.id);
  if (!account) throw new Error("UUID akun belum ditemukan setelah sinkronisasi Social Media Agent.");
  const id = encodeURIComponent(account.id);
  const query = new URLSearchParams({ start_date: range.since, end_date: range.until });
  const [dashboard, demographics, summary, sentiment, reasoning] = await Promise.all([
    request<any>(`/api/analytics/${id}/dashboard?${query}`),
    request<any>(`/api/analytics/${id}/demographics`),
    request<SocialAgentBundle["summary"]>(`/api/ai/${id}/dashboard-summary`),
    request<SocialAgentBundle["sentiment"]>(`/api/ai/${id}/comments-sentiment`),
    request<SocialAgentBundle["reasoning"]>(`/api/ai/${id}/post-reasoning-table`),
  ]);
  return { account, dashboard, demographics, summary, sentiment, reasoning };
}

export const generateSocialAgentBrief = (accountId: string, startDate?: string) =>
  request<Record<string, any>>(`/api/ai/${encodeURIComponent(accountId)}/content-brief`, {
    method: "POST",
    body: JSON.stringify(startDate ? { start_date: startDate } : {}),
  });

export const generateSocialAgentPlan = (accountId: string, startDate?: string) =>
  request<Record<string, any>>(`/api/ai/${encodeURIComponent(accountId)}/content-plan`, {
    method: "POST",
    body: JSON.stringify({ ...(startDate ? { start_date: startDate } : {}), num_days: 7 }),
  });
