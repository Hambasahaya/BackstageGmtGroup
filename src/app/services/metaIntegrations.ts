import { apiRequest, getAuthToken } from "./api";

export type MetaAccountHealth = {
  connected: boolean;
  source?: "env" | "file" | "server";
  error?: string;
  savedAt?: string | null;
  expiresAt?: string | null;
  instagramAccounts: Array<{
    id: string;
    username?: string;
    pageId: string;
    pageName: string;
  }>;
  pages: Array<{
    id: string;
    name: string;
    connected: boolean;
    instagramBusinessAccount: {
      id: string;
      username?: string;
    } | null;
  }>;
};

export type InstagramInsights = {
  connected: boolean;
  error?: string;
  dateRange?: {
    since: string;
    until: string;
  };
  page?: {
    id: string;
    name: string;
  };
  profile?: {
    id: string;
    username?: string;
    name?: string;
    biography?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    profile_picture_url?: string;
    website?: string;
  };
  insights: Array<{
    name: string;
    period: string;
    values: Array<{ value: number | Record<string, unknown>; end_time: string }>;
  }>;
  media: Array<{
    id: string;
    caption?: string;
    media_type?: string;
    media_product_type?: string;
    permalink?: string;
    timestamp?: string;
    like_count?: number;
    comments_count?: number;
    ai_reasoning?: string;
    ai_action?: string;
    ai_angle?: string;
    ai_status?: string;
    ai_reasoning_source?: "alibaba" | "local" | "backend_ai";
    insights?: {
      data?: Array<{
        name: string;
        period?: string;
        values?: Array<{ value: number | Record<string, unknown>; end_time?: string }>;
      }>;
    };
  }>;
  audience?: {
    onlineFollowers?: Array<{ label: string; value: number }>;
    demographics?: {
      age?: Array<{ label: string; value: number }>;
      gender?: Array<{ label: string; value: number }>;
      city?: Array<{ label: string; value: number }>;
      country?: Array<{ label: string; value: number }>;
    };
  };
  contentBrief?: {
    source: string;
    account?: string;
    business_observation?: string;
    performance_insights?: string[];
    weekly_focus?: string;
    summary?: string;
    execution_notes?: string[];
    items: Array<{
      day: string;
      format: string;
      status?: "Proven" | "Eksperimen" | string;
      pillar?: string;
      content_pillar?: "Edukasi" | "Branding" | "Informasi" | "Transaksional" | string;
      objective?: string;
      idea: string;
      ide_utama?: string;
      formatGuide: string;
      format_eksekusi?: string;
      action: string;
      yang_dilakukan?: string;
      reason: string;
      kenapa_format_ini?: string;
      impact: string;
      dampaknya?: string;
      assistant?: {
        formatType?: string;
        caption?: {
          hook?: string;
          body?: string;
          cta?: string;
          hashtags?: string[];
        };
        script?: Array<{
          timecode?: string;
          visual?: string;
          voiceOver?: string;
          onScreenText?: string;
        }>;
        carouselSlides?: Array<{
          slide?: string;
          headline?: string;
          visual?: string;
          copy?: string;
        }>;
        storyFrames?: Array<{
          frame?: string;
          visual?: string;
          text?: string;
          stickerOrCta?: string;
        }>;
        visualDirection?: string;
        shotList?: string[];
        publishChecklist?: string[];
        postPublishChecklist?: string[];
      };
    }>;
  } | null;
  contentReferences?: Array<{
    id: string;
    url?: string;
    accountUrl?: string;
    contentType?: string;
    title?: string;
    caption?: string;
    note?: string;
    hook?: string;
    style?: string;
    reasoning?: string;
    action?: string;
    pillar?: string;
    source?: "alibaba" | "local";
  }>;
  warnings?: string[];
};

export type CompetitorBenchmark = {
  connected: boolean;
  setupRequired?: boolean;
  message?: string;
  source?: "instagram_business_discovery";
  dateRange?: {
    since?: string;
    until?: string;
  };
  competitors: Array<{
    username: string;
    name?: string;
    profilePictureUrl?: string;
    followersCount: number;
    mediaCount: number;
    publicMedia: Array<{
      id: string;
      caption?: string;
      mediaType?: string;
      timestamp?: string;
      permalink?: string;
      likes: number;
      comments: number;
      interactions: number;
      views?: number;
    }>;
    summary: {
      posts: number;
      likes: number;
      comments: number;
      interactions: number;
      avgInteractions: number;
      avgEngagementRate: number | null;
      postingFrequencyPerWeek: number;
    };
  }>;
  warnings?: string[];
};

async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const text = await response.text();
  let payload: any = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      const message = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      throw new Error(message || fallbackMessage);
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || payload.message || fallbackMessage);
  }

  return payload as T;
}

function getHeaders(contentType: string = "application/json") {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getGetHeaders() {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchMetaAuthUrl() {
  const response = await fetch("/api/meta/auth-url", {
    headers: getGetHeaders(),
  });
  return readJsonResponse<{ url: string; scopes: string[] }>(response, "Failed to create Meta OAuth URL.");
}

export async function fetchMetaAccounts() {
  const response = await fetch("/api/meta/accounts", {
    headers: getGetHeaders(),
  });
  return readJsonResponse<MetaAccountHealth>(response, "Failed to fetch Meta accounts.");
}

export async function fetchInstagramInsights(
  igUserId?: string,
  dateRange?: { since: string; until: string },
  skipAi?: boolean,
) {
  const params = new URLSearchParams();
  if (igUserId) params.set("igUserId", igUserId);
  if (dateRange?.since) params.set("since", dateRange.since);
  if (dateRange?.until) params.set("until", dateRange.until);
  if (skipAi) params.set("skip_ai", "true");
  const query = params.size ? `?${params.toString()}` : "";
  const response = await fetch(`/api/meta/instagram-insights${query}`, {
    headers: getGetHeaders(),
  });
  return readJsonResponse<InstagramInsights>(response, "Failed to fetch Instagram insights.");
}

export async function fetchCompetitorBenchmark(
  igUserId?: string,
  dateRange?: { since: string; until: string },
  usernames?: string[],
) {
  const params = new URLSearchParams();
  if (igUserId) params.set("igUserId", igUserId);
  if (dateRange?.since) params.set("since", dateRange.since);
  if (dateRange?.until) params.set("until", dateRange.until);
  if (usernames?.length) params.set("usernames", usernames.join(","));
  const query = params.size ? `?${params.toString()}` : "";
  const response = await fetch(`/api/meta/competitor-benchmark${query}`, {
    headers: getGetHeaders(),
  });
  return readJsonResponse<CompetitorBenchmark>(response, "Failed to fetch competitor benchmark.");
}

export async function generateReferenceBrief(payload: {
  account?: {
    username?: string;
    name?: string;
    biography?: string;
    followers?: number;
    website?: string;
  };
  mainRecommendation?: string;
  selectedBrief?: unknown;
  references: Array<Record<string, unknown>>;
}) {
  const response = await fetch("/api/meta/reference-brief", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonResponse<{ filename: string; html: string }>(response, "Failed to generate reference brief.");
}

export async function generateContentFromBrief(payload: {
  selectedIdea: any;
  contentType: string;
  account?: {
    username?: string;
    name?: string;
    biography?: string;
    followers?: number;
    website?: string;
  };
}) {
  const response = await fetch("/api/meta/generate-content", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonResponse<{
    contentType: string;
    title: string;
    caption: {
      hook: string;
      body: string;
      cta: string;
      hashtags: string[];
    };
    content: {
      script?: Array<{ timecode: string; visual: string; voiceOver: string; onScreenText: string }>;
      storyFrames?: Array<{ frame: string; visual: string; text: string; stickerOrCta: string }>;
      carouselSlides?: Array<{ slide: string; headline: string; visual: string; copy: string }>;
      article?: string;
    };
    metadata: {
      visualDirection?: string;
      shotList?: string[];
      publishChecklist?: string[];
    };
  }>(response, "Failed to generate content.");
}

export async function autoPostInstagramContent(payload: {
  igUserId?: string;
  content: any;
  reference?: Record<string, unknown>;
}) {
  const response = await fetch("/api/meta/auto-post", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonResponse<{
    success: boolean;
    mediaId?: string;
    permalink?: string;
    selectedAsset?: {
      id: string;
      name: string;
      mimeType: string;
    };
  }>(response, "Failed to auto post Instagram content.");
}

export type CachedContentBrief = {
  cached: boolean;
  data: {
    id: number;
    ig_user_id: string;
    ig_username?: string;
    content_brief: InstagramInsights["contentBrief"];
    content_references: InstagramInsights["contentReferences"];
    generated_at: string;
    expires_at: string;
  } | null;
};

export async function fetchContentBriefCache(igUserId: string): Promise<CachedContentBrief> {
  return apiRequest<CachedContentBrief>("/api/marketing/content-brief-cache", {
    method: "GET",
    query: { ig_user_id: igUserId },
  });
}

export async function saveContentBriefCache(payload: {
  ig_user_id: string;
  ig_username?: string;
  content_brief: InstagramInsights["contentBrief"];
  content_references: InstagramInsights["contentReferences"];
}) {
  return apiRequest<{ message: string; data: any }>("/api/marketing/content-brief-cache", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteContentBriefCache(igUserId: string) {
  return apiRequest<{ message: string }>("/api/marketing/content-brief-cache", {
    method: "DELETE",
    query: { ig_user_id: igUserId },
  });
}

export async function fetchInsightsReasoning(payload: {
  ig_user_id: string;
  dateRange: { since: string; until: string };
}) {
  const response = await fetch("/api/meta/insights/reasoning", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonResponse<{
    items: Array<{
      id: string;
      reasoning: string;
      action?: string;
      angle?: string;
      status?: string;
    }>;
    rows: Array<{
      id: string;
      content: string;
      type: string;
      reach: number;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      engagement_rate: number;
      reasoning: string;
      action?: string;
      angle?: string;
      status?: string;
      link: string;
    }>;
  }>(response, "Failed to fetch post reasoning.");
}

export async function fetchCachedInsightsReasoning(params: {
  ig_user_id: string;
  since: string;
  until: string;
  post_id?: string;
}) {
  const query = new URLSearchParams({
    ig_user_id: params.ig_user_id,
    since: params.since,
    until: params.until,
  });
  if (params.post_id) {
    query.set("post_id", params.post_id);
  }
  const response = await fetch(`/api/meta/insights/reasoning?${query.toString()}`, {
    method: "GET",
    headers: getGetHeaders(),
  });
  return readJsonResponse<{
    cached: boolean;
    total: number;
    filter: {
      account: string;
      since: string;
      until: string;
      post_id?: string;
    };
    items: Array<{
      id: string;
      reasoning: string;
      action?: string;
      angle?: string;
      status?: string;
    }>;
  }>(response, "Failed to fetch cached post reasoning.");
}

export async function fetchContentPlan(payload: {
  ig_user_id: string;
  profile?: { username?: string };
  dateRange: { since: string; until: string };
  force_refresh?: boolean;
}) {
  const response = await fetch("/api/meta/insights/content-plan", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return readJsonResponse<{
    contentBrief: InstagramInsights["contentBrief"];
  }>(response, "Failed to generate content plan.");
}
