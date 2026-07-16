import { getStoredTokenBundle, json, sanitizePage } from "./_meta-client.js";
import { getStorePath } from "./_token-store.js";

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
    const bundle = await getStoredTokenBundle();
    const allPages = (bundle.pages || []).map(sanitizePage);
    
    // Filter out 'louder' and 'antari' accounts from display
    const pages = allPages.filter((page) => {
      const name = (page.name || "").toLowerCase();
      const username = (page.instagramBusinessAccount?.username || "").toLowerCase();
      return !name.includes("louder") && !name.includes("antari") &&
             !username.includes("louder") && !username.includes("antari");
    });

    const instagramAccounts = pages
      .filter((page) => page.instagramBusinessAccount?.id)
      .map((page) => ({
        pageId: page.id,
        pageName: page.name,
        ...page.instagramBusinessAccount,
      }));

    json(response, 200, {
      connected: instagramAccounts.length > 0,
      source: bundle.source || "server",
      savedAt: bundle.savedAt || null,
      expiresAt: bundle.expiresAt || null,
      tokenStore: bundle.source === "env" ? "env" : getStorePath(),
      pages,
      instagramAccounts,
    });
  } catch (error) {
    json(response, 200, {
      connected: false,
      error: error.message || "Meta account check failed.",
      pages: [],
      instagramAccounts: [],
    });
  }
}
