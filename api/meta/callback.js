import { getRequiredConfig, GRAPH_BASE_URL, json, metaFetch } from "./_meta-client.js";
import { writeTokenBundle } from "./_token-store.js";

const exchangeCodeForToken = async ({ code, appId, appSecret, redirectUri }) => {
  const url = new URL(`${GRAPH_BASE_URL}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "Meta OAuth code exchange failed.");
  }

  return payload;
};

const exchangeForLongLivedToken = async ({ accessToken, appId, appSecret }) => {
  const url = new URL(`${GRAPH_BASE_URL}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", accessToken);

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "Meta long-lived token exchange failed.");
  }

  return payload;
};

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "GET") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state") || "";
    const expectedState = process.env.META_OAUTH_STATE || "";

    if (!code) {
      json(response, 400, { error: "Missing Meta OAuth code." });
      return;
    }

    if (expectedState && state !== expectedState) {
      json(response, 400, { error: "Invalid Meta OAuth state." });
      return;
    }

    const { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } = getRequiredConfig();
    const shortLived = await exchangeCodeForToken({
      code,
      appId: META_APP_ID,
      appSecret: META_APP_SECRET,
      redirectUri: META_REDIRECT_URI,
    });
    const longLived = await exchangeForLongLivedToken({
      accessToken: shortLived.access_token,
      appId: META_APP_ID,
      appSecret: META_APP_SECRET,
    });
    const userAccessToken = longLived.access_token || shortLived.access_token;
    const expiresIn = Number(longLived.expires_in || shortLived.expires_in || 0);
    const pagesPayload = await metaFetch(
      "/me/accounts",
      {
        fields: "name,access_token,tasks,instagram_business_account{id,username,profile_picture_url}",
      },
      userAccessToken,
    );

    await writeTokenBundle({
      userAccessToken,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      pages: pagesPayload.data || [],
    });

    const dashboardUrl = process.env.META_DASHBOARD_URL || "/integrations";
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(`<!doctype html>
<html>
  <head><title>Meta connected</title></head>
  <body style="font-family: system-ui, sans-serif; padding: 32px;">
    <h1>Meta connected</h1>
    <p>OAuth selesai. Token disimpan server-side dan dashboard sudah bisa membaca status koneksi.</p>
    <p><a href="${dashboardUrl}">Kembali ke Marketing Integrations</a></p>
  </body>
</html>`);
  } catch (error) {
    json(response, 500, { error: error.message || "Meta OAuth callback failed." });
  }
}
