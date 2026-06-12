export type MetaAccountHealth = {
  connected: boolean;
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
  page?: {
    id: string;
    name: string;
  };
  profile?: {
    id: string;
    username?: string;
    followers_count?: number;
    media_count?: number;
  };
  insights: Array<{
    name: string;
    period: string;
    values: Array<{ value: number; end_time: string }>;
  }>;
  media: Array<{
    id: string;
    caption?: string;
    media_type?: string;
    permalink?: string;
    timestamp?: string;
    like_count?: number;
    comments_count?: number;
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

export async function fetchInstagramInsights() {
  const response = await fetch("/api/meta/instagram-insights");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to fetch Instagram insights.");
  }

  return payload as InstagramInsights;
}
