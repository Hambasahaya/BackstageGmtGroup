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

export async function fetchMetaAuthUrl() {
  const response = await fetch("/api/meta/auth-url");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to create Meta OAuth URL.");
  }

  return payload as { url: string; scopes: string[] };
}

export async function fetchMetaAccounts() {
  const response = await fetch("/api/meta/accounts");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to fetch Meta accounts.");
  }

  return payload as MetaAccountHealth;
}

import { apiRequest } from "./api";

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
  const response = await fetch(`/api/meta/instagram-insights${query}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to fetch Instagram insights.");
  }

  return payload as InstagramInsights;
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to generate reference brief.");
  }

  return result as { filename: string; html: string };
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to generate content.");
  }

  return result as {
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
