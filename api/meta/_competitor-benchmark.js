import { findInstagramPage, getStoredTokenBundle, json, metaFetch } from "./_meta-client.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateRange = (requestUrl) => {
  const since = requestUrl.searchParams.get("since") || "";
  const until = requestUrl.searchParams.get("until") || "";

  if ((since && !DATE_PATTERN.test(since)) || (until && !DATE_PATTERN.test(until))) {
    throw new Error("Format tanggal harus YYYY-MM-DD.");
  }

  return { since, until };
};

const parseUsernames = (requestUrl) => {
  const raw = requestUrl.searchParams.get("usernames") || process.env.META_COMPETITOR_USERNAMES || "";
  return raw
    .split(",")
    .map((username) => username.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean)
    .filter((username, index, list) => list.indexOf(username) === index)
    .slice(0, 8);
};

const isWithinRange = (timestamp, since, until) => {
  if (!timestamp || (!since && !until)) return true;

  const time = Date.parse(timestamp);
  if (!Number.isFinite(time)) return true;

  const sinceTime = since ? Date.parse(`${since}T00:00:00Z`) : Number.NEGATIVE_INFINITY;
  const untilTime = until ? Date.parse(`${until}T23:59:59Z`) : Number.POSITIVE_INFINITY;

  return time >= sinceTime && time <= untilTime;
};

const getPublicMedia = (account, since, until) => {
  const media = account.media?.data || [];
  return media
    .filter((item) => isWithinRange(item.timestamp, since, until))
    .map((item) => {
      const likes = Number(item.like_count) || 0;
      const comments = Number(item.comments_count) || 0;
      return {
        id: item.id,
        caption: item.caption || "",
        mediaType: item.media_type || "",
        timestamp: item.timestamp || "",
        permalink: item.permalink || "",
        likes,
        comments,
        interactions: likes + comments,
      };
    });
};

const buildSummary = (account, publicMedia, since, until) => {
  const followers = Number(account.followers_count) || 0;
  const likes = publicMedia.reduce((total, item) => total + item.likes, 0);
  const comments = publicMedia.reduce((total, item) => total + item.comments, 0);
  const interactions = likes + comments;
  const avgInteractions = publicMedia.length ? interactions / publicMedia.length : 0;
  const avgEngagementRate = followers && publicMedia.length ? avgInteractions / followers : null;
  const sinceTime = since ? Date.parse(`${since}T00:00:00Z`) : undefined;
  const untilTime = until ? Date.parse(`${until}T23:59:59Z`) : undefined;
  const rangeDays = sinceTime && untilTime && untilTime >= sinceTime
    ? Math.max(1, Math.round((untilTime - sinceTime) / (24 * 60 * 60 * 1000)) + 1)
    : 30;

  return {
    posts: publicMedia.length,
    likes,
    comments,
    interactions,
    avgInteractions,
    avgEngagementRate,
    postingFrequencyPerWeek: publicMedia.length / (rangeDays / 7),
  };
};

const fetchCompetitor = async ({ viewerIgUserId, username, accessToken, since, until, limit }) => {
  const fields = [
    `business_discovery.username(${username}){`,
    "id,username,name,profile_picture_url,followers_count,media_count,",
    `media.limit(${limit}){id,caption,media_type,timestamp,like_count,comments_count,permalink}`,
    "}",
  ].join("");
  const payload = await metaFetch(`/${viewerIgUserId}`, { fields }, accessToken);
  const account = payload.business_discovery;

  if (!account?.username) {
    throw new Error(`Akun @${username} tidak ditemukan atau tidak tersedia melalui business_discovery.`);
  }

  const publicMedia = getPublicMedia(account, since, until);

  return {
    username: account.username,
    name: account.name || "",
    profilePictureUrl: account.profile_picture_url || "",
    followersCount: Number(account.followers_count) || 0,
    mediaCount: Number(account.media_count) || 0,
    publicMedia,
    summary: buildSummary(account, publicMedia, since, until),
  };
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
    const usernames = parseUsernames(requestUrl);
    const { since, until } = parseDateRange(requestUrl);
    const limit = Math.max(3, Math.min(Number(process.env.META_COMPETITOR_MEDIA_LIMIT || 24), 50));

    if (!usernames.length) {
      json(response, 200, {
        connected: false,
        setupRequired: true,
        message: "Set META_COMPETITOR_USERNAMES=kompetitor1,kompetitor2 untuk menampilkan benchmark kompetitor.",
        competitors: [],
        warnings: [],
      });
      return;
    }

    const bundle = await getStoredTokenBundle(request);
    const page = findInstagramPage(bundle, undefined, requestUrl.searchParams.get("igUserId"));
    const viewerIgUserId = requestUrl.searchParams.get("igUserId") || page?.instagram_business_account?.id;
    const accessToken = page?.access_token || process.env.META_PAGE_ACCESS_TOKEN || bundle.userAccessToken;

    if (!viewerIgUserId || !accessToken) {
      json(response, 400, { error: "Instagram Business account dan access token diperlukan untuk business_discovery." });
      return;
    }

    const results = await Promise.all(usernames.map(async (username) => {
      try {
        return {
          data: await fetchCompetitor({ viewerIgUserId, username, accessToken, since, until, limit }),
          warning: null,
        };
      } catch (error) {
        return {
          data: null,
          warning: `@${username}: ${error.message}`,
        };
      }
    }));

    json(response, 200, {
      connected: true,
      source: "instagram_business_discovery",
      dateRange: { since, until },
      competitors: results.map((result) => result.data).filter(Boolean),
      warnings: results.map((result) => result.warning).filter(Boolean),
    });
  } catch (error) {
    json(response, 500, { error: error.message || "Competitor benchmark failed." });
  }
}
