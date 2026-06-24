import "./_load-env.js";
import { findInstagramPage, GRAPH_BASE_URL, getStoredTokenBundle, json } from "./_meta-client.js";

const getAiProviderConfig = () => {
  const apiKey =
    process.env.ALIBABA_MODEL_STUDIO_API_KEY ||
    process.env.ALIBABA_API_KEY ||
    process.env.DASHSCOPE_API_KEY;

  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (process.env.ALIBABA_MODEL_STUDIO_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/$/, ""),
    model: process.env.ALIBABA_MODEL || "qwen3.7-plus",
  };
};

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });

const postGraph = async (endpoint, params, token) => {
  const response = await fetch(`${GRAPH_BASE_URL}${endpoint}`, {
    method: "POST",
    body: new URLSearchParams({
      ...Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")),
      access_token: token,
    }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "Meta Graph API publish request failed.");
  }

  return payload;
};

const getGoogleAccessToken = async () => {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return "";
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Google OAuth token refresh failed.");
  }

  return payload.access_token || "";
};

const listDriveAssets = async () => {
  const folderId = process.env.GOOGLE_DRIVE_ASSET_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error("Set GOOGLE_DRIVE_ASSET_FOLDER_ID to the Drive folder that stores Instagram image/video assets.");
  }

  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error("Set GOOGLE_OAUTH_ACCESS_TOKEN or GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN for Google Drive access.");
  }

  const query = [
    `'${folderId}' in parents`,
    "trashed = false",
    "(mimeType contains 'image/' or mimeType contains 'video/')",
  ].join(" and ");
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "files(id,name,mimeType,description,webContentLink,webViewLink,modifiedTime)");
  url.searchParams.set("pageSize", process.env.GOOGLE_DRIVE_ASSET_LIMIT || "25");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "Google Drive asset lookup failed.");
  }

  return payload.files || [];
};

const extractJsonObject = (text) => {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
};

const chooseAssetWithAi = async ({ assets, content, reference }) => {
  const config = getAiProviderConfig();
  if (!config) return null;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "You are a social media producer. Return only valid JSON." },
        {
          role: "user",
          content: [
            "Pick the best Google Drive asset for this Instagram post using the file names, mime types, and content brief.",
            "Return schema: {\"assetId\":\"\",\"reason\":\"\"}",
            JSON.stringify({
              content: {
                type: content.contentType,
                title: content.title,
                caption: content.caption,
                visualDirection: content.metadata?.visualDirection,
                shotList: content.metadata?.shotList,
              },
              reference,
              assets: assets.map((asset) => ({
                id: asset.id,
                name: asset.name,
                mimeType: asset.mimeType,
                description: asset.description,
              })),
            }),
          ].join("\n"),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 800,
    }),
  });
  const payload = await response.json();

  if (!response.ok) return null;
  return extractJsonObject(payload.choices?.[0]?.message?.content || "");
};

const chooseDriveAsset = async ({ assets, content, reference }) => {
  const aiChoice = await chooseAssetWithAi({ assets, content, reference });
  const aiAsset = assets.find((asset) => asset.id === aiChoice?.assetId);
  if (aiAsset) return aiAsset;

  const type = String(content.contentType || "").toLowerCase();
  const wantsVideo = /reel|video/.test(type);
  const preferred = assets.filter((asset) => wantsVideo ? asset.mimeType.startsWith("video/") : asset.mimeType.startsWith("image/"));

  return preferred[0] || assets[0] || null;
};

const buildCaption = (content) => {
  const caption = content.caption || {};
  return [
    caption.hook,
    caption.body,
    caption.cta,
    Array.isArray(caption.hashtags) ? caption.hashtags.join(" ") : "",
  ].filter(Boolean).join("\n\n").slice(0, 2200);
};

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    if (process.env.META_ENABLE_AUTO_POST !== "true") {
      json(response, 409, {
        error: "Auto post is disabled. Set META_ENABLE_AUTO_POST=true after adding instagram_content_publish permission and Google Drive asset config.",
      });
      return;
    }

    const body = await readJsonBody(request);
    if (!body.content) {
      json(response, 400, { error: "Missing generated content payload." });
      return;
    }

    const bundle = await getStoredTokenBundle();
    const page = findInstagramPage(bundle, undefined, body.igUserId);
    const igUserId = body.igUserId || page?.instagram_business_account?.id;
    const pageAccessToken = page?.access_token || process.env.META_PAGE_ACCESS_TOKEN;

    if (!igUserId || !pageAccessToken) {
      json(response, 400, { error: "Instagram Business account and Page access token are required for publishing." });
      return;
    }

    const assets = await listDriveAssets();
    if (!assets.length) {
      json(response, 404, { error: "No image or video assets found in the configured Google Drive folder." });
      return;
    }

    const selectedAsset = await chooseDriveAsset({ assets, content: body.content, reference: body.reference });
    if (!selectedAsset) {
      json(response, 404, { error: "No suitable Drive asset found for this content." });
      return;
    }

    const publicAssetUrl = process.env.GOOGLE_DRIVE_PUBLIC_ASSET_BASE_URL
      ? `${process.env.GOOGLE_DRIVE_PUBLIC_ASSET_BASE_URL.replace(/\/$/, "")}/${selectedAsset.id}`
      : `https://drive.google.com/uc?export=download&id=${selectedAsset.id}`;
    const isVideo = selectedAsset.mimeType.startsWith("video/");
    const container = await postGraph(
      `/${igUserId}/media`,
      {
        caption: buildCaption(body.content),
        media_type: isVideo ? "REELS" : undefined,
        image_url: isVideo ? undefined : publicAssetUrl,
        video_url: isVideo ? publicAssetUrl : undefined,
      },
      pageAccessToken,
    );
    const published = await postGraph(
      `/${igUserId}/media_publish`,
      { creation_id: container.id },
      pageAccessToken,
    );

    json(response, 200, {
      success: true,
      mediaId: published.id,
      selectedAsset: {
        id: selectedAsset.id,
        name: selectedAsset.name,
        mimeType: selectedAsset.mimeType,
      },
    });
  } catch (error) {
    json(response, 500, { error: error.message || "Instagram auto post failed." });
  }
}
