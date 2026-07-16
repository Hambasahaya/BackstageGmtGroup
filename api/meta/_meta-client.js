import "./_load-env.js";
import { readTokenBundle } from "./_token-store.js";

export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v22.0";
export const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const INSTAGRAM_GRAPH_BASE_URL = `https://graph.instagram.com/${GRAPH_VERSION}`;

export const getGraphBaseUrl = (token) => {
  const mode = (process.env.META_API_MODE || "").toLowerCase();

  if (mode === "instagram" || token?.startsWith("IGA")) {
    return INSTAGRAM_GRAPH_BASE_URL;
  }

  return GRAPH_BASE_URL;
};

export const json = (response, statusCode, body) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
};

export const getRequiredConfig = () => {
  const { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } = process.env;

  if (!META_APP_ID || !META_APP_SECRET || !META_REDIRECT_URI) {
    throw new Error("Missing Meta config. Set META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI.");
  }

  return { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI };
};

export const metaFetch = async (endpoint, params = {}, token) => {
  const url = new URL(`${getGraphBaseUrl(token)}${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  if (token) {
    url.searchParams.set("access_token", token);
  }

  const response = await fetch(url);
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: { message: text } };
  }

  if (!response.ok) {
    throw new Error(payload.error?.message || payload.message || "Meta Graph API request failed.");
  }

  return payload;
};

export const getStoredTokenBundle = async () => {
  const bundle = await readTokenBundle();

  if (!bundle) {
    throw new Error("Meta is not connected yet. Open /api/meta/auth-url and complete OAuth first.");
  }

  if (bundle.source === "env" && !bundle.pages?.length && bundle.userAccessToken) {
    const pagesPayload = await metaFetch(
      "/me/accounts",
      {
        fields: "name,access_token,tasks,instagram_business_account{id,username,profile_picture_url}",
      },
      bundle.userAccessToken,
    );

    return { ...bundle, pages: pagesPayload.data || [] };
  }

  return bundle;
};

export const findInstagramPage = (bundle, pageId, igUserId) => {
  const pages = bundle.pages || [];

  if (igUserId) {
    return pages.find((page) => page.instagram_business_account?.id === igUserId);
  }

  if (pageId) {
    return pages.find((page) => page.id === pageId);
  }

  return pages.find((page) => page.instagram_business_account?.id);
};

export const sanitizePage = (page) => ({
  id: page.id,
  name: page.name,
  tasks: page.tasks || [],
  instagramBusinessAccount: page.instagram_business_account || null,
  connected: Boolean(page.instagram_business_account?.id && page.access_token),
});
