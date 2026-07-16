import { apiRequest, clientName } from "./api";

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

type ApiEnvelope<T> = {
  success?: boolean;
  cached?: boolean;
  queued?: boolean;
  message?: string;
  error?: string;
  data?: T;
};

type GoMetaAccount = {
  id?: number;
  connection_id?: number;
  page_id?: string;
  page_name?: string;
  ig_user_id?: string;
  ig_username?: string;
  profile_picture_url?: string;
  tasks?: string[];
};

type GoInstagramInsights = {
  ig_user_id?: string;
  since?: string;
  until?: string;
  profile?: InstagramInsights["profile"];
  insights?: InstagramInsights["insights"] | Record<string, unknown>;
  media?: InstagramInsights["media"];
  audience?: InstagramInsights["audience"];
  warnings?: string[];
  fetched_at?: string;
  expires_at?: string;
  contentBrief?: InstagramInsights["contentBrief"];
  contentReferences?: InstagramInsights["contentReferences"];
  content_brief?: InstagramInsights["contentBrief"];
  content_references?: InstagramInsights["contentReferences"];
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
    ai_reasoning_source?: "alibaba" | "local";
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
    source: "alibaba";
    summary?: string;
    items: Array<{
      day: string;
      format: string;
      pillar?: string;
      objective?: string;
      idea: string;
      formatGuide: string;
      action: string;
      reason: string;
      impact: string;
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

export async function fetchMetaAuthUrl() {
  const payload = await apiRequest<ApiEnvelope<{ auth_url?: string; url?: string; scopes?: string[] }> & { auth_url?: string; url?: string; scopes?: string[] }>(
    "/api/meta/auth-url",
    {
      method: "GET",
      auth: false,
      query: {
        client_name: clientName,
        source: "frontend",
        return_url: `${window.location.origin}/integrations`,
      },
    },
  );
  const data = payload.data ?? payload;
  const url = data.auth_url || data.url;

  if (!url) {
    throw new Error(payload.error || payload.message || "Failed to create Meta OAuth URL.");
  }

  return { url, auth_url: url, scopes: data.scopes || [] };
}

export async function fetchMetaAccounts() {
  const payload = await apiRequest<ApiEnvelope<GoMetaAccount[]> | MetaAccountHealth>("/api/meta/accounts", {
    method: "GET",
  });

  if ("instagramAccounts" in payload) {
    return payload;
  }

  const accounts = payload.data || [];
  const pages = accounts.map((account) => ({
    id: account.page_id || String(account.id || ""),
    name: account.page_name || account.ig_username || "",
    connected: Boolean(account.ig_user_id),
    instagramBusinessAccount: account.ig_user_id
      ? {
          id: account.ig_user_id,
          username: account.ig_username,
        }
      : null,
  }));

  return {
    connected: accounts.length > 0,
    source: "server",
    error: payload.error || undefined,
    savedAt: null,
    expiresAt: null,
    instagramAccounts: accounts
      .filter((account) => account.ig_user_id)
      .map((account) => ({
        id: account.ig_user_id || "",
        username: account.ig_username,
        pageId: account.page_id || String(account.id || ""),
        pageName: account.page_name || account.ig_username || "",
      })),
    pages,
  };
}

export async function fetchInstagramInsights(
  igUserId?: string,
  dateRange?: { since: string; until: string },
  skipAi?: boolean,
) {
  const payload = await apiRequest<ApiEnvelope<GoInstagramInsights> | InstagramInsights>("/api/meta/instagram-insights", {
    method: "GET",
    query: {
      igUserId,
      since: dateRange?.since,
      until: dateRange?.until,
      skip_ai: skipAi ? "true" : undefined,
    },
  });

  if ("connected" in payload && "media" in payload) {
    return payload;
  }

  const data = payload.data || {};
  const insights = Array.isArray(data.insights) ? data.insights : [];

  return {
    connected: Boolean(data.ig_user_id || data.profile),
    dateRange: {
      since: data.since || dateRange?.since || "",
      until: data.until || dateRange?.until || "",
    },
    profile: data.profile,
    insights,
    media: data.media || [],
    audience: data.audience,
    contentBrief: data.contentBrief ?? data.content_brief ?? null,
    contentReferences: data.contentReferences ?? data.content_references ?? [],
    warnings: data.warnings || [],
  };
}

export async function fetchCompetitorBenchmark(
  igUserId?: string,
  dateRange?: { since: string; until: string },
) {
  const payload = await apiRequest<ApiEnvelope<Partial<CompetitorBenchmark>> | CompetitorBenchmark>("/api/meta/competitor-benchmark", {
    method: "GET",
    query: {
      igUserId,
      since: dateRange?.since,
      until: dateRange?.until,
    },
  });

  if ("competitors" in payload) {
    return payload;
  }

  return {
    connected: false,
    competitors: [],
    warnings: payload.data?.warnings || [payload.message || "Competitor benchmark belum tersedia di backend Go."],
    ...payload.data,
  };
}

export async function generateReferenceBrief(requestPayload: {
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
  const result = await apiRequest<ApiEnvelope<{ queued?: boolean; filename?: string; html?: string }>>("/api/meta/reference-brief", {
    method: "POST",
    body: JSON.stringify(requestPayload),
  });
  const data = result.data || {};

  if (result.queued || data.queued) {
    throw new Error(result.message || "Reference brief masuk antrean backend dan akan tersedia setelah diproses.");
  }

  if (!data.filename || !data.html) {
    throw new Error(result.message || "Reference brief belum tersedia dari backend.");
  }

  return { filename: data.filename, html: data.html };
}

export async function generateContentFromBrief(requestPayload: {
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
  const result = await apiRequest<ApiEnvelope<{
    queued?: boolean;
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
  }>>("/api/meta/generate-content", {
    method: "POST",
    body: JSON.stringify(requestPayload),
  });
  const data = result.data || {};

  if (result.queued || data.queued) {
    return {
      queued: true,
      contentType: requestPayload.contentType,
      title: "Konten masuk antrean",
      caption: {
        hook: "Request sudah diterima backend.",
        body: result.message || "Generate content sedang diproses di backend Go. Cek kembali hasilnya setelah job selesai.",
        cta: "",
        hashtags: [],
      },
      content: {},
      metadata: {},
    };
  }

  return data as {
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
    queued?: boolean;
  };
}

export async function autoPostInstagramContent(payload: {
  igUserId?: string;
  content: any;
  reference?: Record<string, unknown>;
}) {
  const result = await apiRequest<{
    success?: boolean;
    message?: string;
    error?: string;
    data?: {
      success?: boolean;
      mediaId?: string;
      permalink?: string;
      selectedAsset?: {
        id: string;
        name: string;
        mimeType: string;
      };
    };
  }>("/api/meta/auto-post", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    ...(result.data || {}),
    success: result.data?.success ?? result.success ?? false,
  } as {
    success: boolean;
    mediaId?: string;
    permalink?: string;
    selectedAsset?: {
      id: string;
      name: string;
      mimeType: string;
    };
  };
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
  const result = await apiRequest<
    CachedContentBrief | (ApiEnvelope<CachedContentBrief["data"]> & { cached?: boolean })
  >("/api/marketing/content-brief-cache", {
    method: "GET",
    query: { ig_user_id: igUserId },
  });

  if ("cached" in result && ("data" in result)) {
    return {
      cached: Boolean(result.cached && result.data),
      data: result.data ?? null,
    };
  }

  return { cached: false, data: null };
}

export async function saveContentBriefCache(payload: {
  ig_user_id: string;
  ig_username?: string;
  content_brief: InstagramInsights["contentBrief"];
  content_references: InstagramInsights["contentReferences"];
}) {
  return apiRequest<ApiEnvelope<any> & { message?: string }>("/api/marketing/content-brief-cache", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteContentBriefCache(igUserId: string) {
  return apiRequest<ApiEnvelope<null> & { message?: string }>("/api/marketing/content-brief-cache", {
    method: "DELETE",
    query: { ig_user_id: igUserId },
  });
}
