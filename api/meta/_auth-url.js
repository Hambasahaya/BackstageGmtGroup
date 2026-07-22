import { getRequiredConfig, GRAPH_VERSION, json } from "./_meta-client.js";

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
    const { META_APP_ID, META_REDIRECT_URI } = getRequiredConfig();
    const scopes =
      process.env.META_SCOPES ||
      "pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,instagram_manage_comments,instagram_content_publish";
    const state = process.env.META_OAUTH_STATE || "";
    const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);

    url.searchParams.set("client_id", META_APP_ID);
    url.searchParams.set("redirect_uri", META_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scopes);

    if (state) {
      url.searchParams.set("state", state);
    }

    json(response, 200, { url: url.toString(), scopes: scopes.split(",") });
  } catch (error) {
    json(response, 500, { error: error.message || "Failed to create Meta OAuth URL." });
  }
}
