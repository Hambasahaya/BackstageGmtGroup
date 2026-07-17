import "./_load-env.js";
import { findInstagramPage, getGraphBaseUrl, getStoredTokenBundle, json } from "./_meta-client.js";

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
  const baseUrl = getGraphBaseUrl(token);
  const response = await fetch(`${baseUrl}${endpoint}`, {
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

const waitForMediaReady = async (containerId, token, maxRetries = 12, delayMs = 5000) => {
  const baseUrl = getGraphBaseUrl(token);
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(`${baseUrl}/${containerId}?fields=status_code&access_token=${token}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || "Failed to check media container status.");
    }
    
    const status = payload.status_code;
    if (status === "FINISHED") return true;
    if (status === "ERROR") throw new Error("Instagram failed to process the media container.");
    
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("Media processing timed out. Please try again later.");
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

const normalizeWords = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9#\s]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

const hashText = (value) =>
  String(value || "").split("").reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 7);

const getContentAssetText = (content = {}, reference = {}) => [
  content.contentType,
  content.title,
  content.caption?.hook,
  content.caption?.body,
  content.metadata?.visualDirection,
  ...(Array.isArray(content.metadata?.shotList) ? content.metadata.shotList : []),
  reference?.caption,
  reference?.reasoning,
  reference?.style,
  reference?.pillar,
].filter(Boolean).join(" ");

const scoreAsset = ({ asset, words, wantsVideo }) => {
  const assetText = normalizeWords([asset.name, asset.description, asset.mimeType].filter(Boolean).join(" "));
  const matches = assetText.filter((word) => words.includes(word)).length;
  const mediaScore = wantsVideo === asset.mimeType.startsWith("video/") ? 8 : 0;
  const ageDays = asset.modifiedTime
    ? Math.max(0, Math.floor((Date.now() - new Date(asset.modifiedTime).getTime()) / 86400000))
    : 30;
  const freshnessScore = Math.max(0, 4 - Math.min(4, ageDays));

  return matches * 3 + mediaScore + freshnessScore;
};

const rankDriveAssets = ({ assets, content, reference, carousel = false }) => {
  const type = String(content.contentType || "").toLowerCase();
  const wantsVideo = !carousel && /reel|video/.test(type);
  const usable = assets.filter((asset) => {
    if (carousel) return asset.mimeType.startsWith("image/");
    return wantsVideo ? asset.mimeType.startsWith("video/") : asset.mimeType.startsWith("image/");
  });
  const pool = usable.length ? usable : assets;
  const contentText = getContentAssetText(content, reference);
  const words = normalizeWords(contentText);
  const offset = pool.length ? hashText(contentText) % pool.length : 0;

  return pool
    .map((asset, index) => ({
      asset,
      score: scoreAsset({ asset, words, wantsVideo }),
      tieBreaker: (index - offset + pool.length) % pool.length,
    }))
    .sort((first, second) => (second.score - first.score) || (first.tieBreaker - second.tieBreaker))
    .map((item) => item.asset);
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

  const preferred = rankDriveAssets({ assets, content, reference });

  return preferred[0] || assets[0] || null;
};

const chooseCarouselAssets = ({ assets, content, reference }) => {
  const slideCount = Array.isArray(content.content?.carouselSlides)
    ? Math.min(10, Math.max(2, content.content.carouselSlides.length))
    : 5;
  const ranked = rankDriveAssets({ assets, content, reference, carousel: true });
  const unique = Array.from(new Map(ranked.map((asset) => [asset.id, asset])).values());

  return unique.slice(0, slideCount);
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

    const bundle = await getStoredTokenBundle(request);
    const page = findInstagramPage(bundle, undefined, body.igUserId);
    const igUserId = body.igUserId || page?.instagram_business_account?.id;
    const pageAccessToken = page?.access_token || process.env.META_PAGE_ACCESS_TOKEN;

    if (!igUserId || !pageAccessToken) {
      json(response, 400, { error: "Instagram Business account and Page access token are required for publishing." });
      return;
    }

    if (page?.token_source === "legacy_instagram_token") {
      json(response, 400, {
        error: "Auto post is using META_IG_ACCESS_TOKEN. Use META_INSTAGRAM_ACCOUNTS with a pageAccessToken/accessToken from the connected Facebook Page, or set META_PAGE_ACCESS_TOKEN.",
      });
      return;
    }

    const assets = await listDriveAssets();
    if (!assets.length) {
      json(response, 404, { error: "No image or video assets found in the configured Google Drive folder." });
      return;
    }

    const isCarousel = String(body.content.contentType || "").toLowerCase() === "carousel";
    const selectedAssets = isCarousel
      ? chooseCarouselAssets({ assets, content: body.content, reference: body.reference })
      : [];
    const selectedAsset = isCarousel
      ? selectedAssets[0]
      : await chooseDriveAsset({ assets, content: body.content, reference: body.reference });
    if (!selectedAsset) {
      json(response, 404, { error: "No suitable Drive asset found for this content." });
      return;
    }

    const getPublicAssetUrl = (asset) => process.env.GOOGLE_DRIVE_PUBLIC_ASSET_BASE_URL
      ? `${process.env.GOOGLE_DRIVE_PUBLIC_ASSET_BASE_URL.replace(/\/$/, "")}/${asset.id}`
      : `https://drive.google.com/uc?export=download&id=${asset.id}`;

    let container;
    if (isCarousel) {
      if (selectedAssets.length < 2) {
        json(response, 400, { error: "Carousel publishing requires at least 2 image assets in the configured Google Drive folder." });
        return;
      }

      const childContainers = [];
      for (const asset of selectedAssets) {
        const child = await postGraph(
          `/${igUserId}/media`,
          {
            image_url: getPublicAssetUrl(asset),
            is_carousel_item: "true",
          },
          pageAccessToken,
        );
        childContainers.push(child.id);
      }

      container = await postGraph(
        `/${igUserId}/media`,
        {
          caption: buildCaption(body.content),
          media_type: "CAROUSEL",
          children: childContainers.join(","),
        },
        pageAccessToken,
      );
    } else {
      const publicAssetUrl = getPublicAssetUrl(selectedAsset);
      const isVideo = selectedAsset.mimeType.startsWith("video/");
      container = await postGraph(
        `/${igUserId}/media`,
        {
          caption: buildCaption(body.content),
          media_type: isVideo ? "REELS" : undefined,
          image_url: isVideo ? undefined : publicAssetUrl,
          video_url: isVideo ? publicAssetUrl : undefined,
        },
        pageAccessToken,
      );
    }

    // Wait for the container to be ready (Instagram processing)
    await waitForMediaReady(container.id, pageAccessToken);

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
      selectedAssets: selectedAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        mimeType: asset.mimeType,
      })),
    });
  } catch (error) {
    json(response, 500, { error: error.message || "Instagram auto post failed." });
  }
}
