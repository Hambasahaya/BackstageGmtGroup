import { json } from "./_meta-client.js";

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

const fetchApifyData = async (usernames) => {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("APIFY_API_TOKEN is not configured in the environment variables.");
  }
  const actor = "apify~instagram-profile-scraper";
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Apify API error ${response.status}`);
  }

  return response.json();
};

const mapApifyToBenchmark = (apifyData) => {
  const results = [];
  const warnings = [];

  for (const profile of apifyData) {
    if (profile.error) {
      warnings.push(`@${profile.username || 'unknown'}: ${profile.error}`);
      continue;
    }

    const publicMedia = (profile.latestPosts || []).map(post => {
      const likes = post.likesCount || 0;
      const comments = post.commentsCount || 0;
      return {
        id: post.shortCode || post.id,
        caption: post.caption || "",
        mediaType: post.type?.toUpperCase() || "IMAGE",
        timestamp: post.timestamp || "",
        permalink: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
        likes,
        comments,
        interactions: likes + comments,
        views: post.videoViewCount || 0,
      };
    });

    const postCount = publicMedia.length;
    const likes = publicMedia.reduce((sum, p) => sum + p.likes, 0);
    const comments = publicMedia.reduce((sum, p) => sum + p.comments, 0);
    const interactions = likes + comments;
    const avgInteractions = postCount > 0 ? interactions / postCount : 0;
    const followers = profile.followersCount || 0;
    const avgEngagementRate = followers > 0 ? avgInteractions / followers : 0;

    results.push({
      username: profile.username,
      name: profile.fullName || "",
      profilePictureUrl: profile.profilePicUrl || "",
      followersCount: followers,
      mediaCount: profile.postsCount || 0,
      publicMedia,
      summary: {
        posts: postCount,
        likes,
        comments,
        interactions,
        avgInteractions,
        avgEngagementRate,
        postingFrequencyPerWeek: postCount > 0 ? (postCount / 30) * 7 : 0
      }
    });
  }

  return { results, warnings };
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

    if (!usernames.length) {
      json(response, 200, {
        connected: false,
        setupRequired: true,
        message: "Masukkan username kompetitor untuk membandingkan data melalui Apify.",
        competitors: [],
        warnings: [],
      });
      return;
    }

    const apifyData = await fetchApifyData(usernames);
    const { results, warnings } = mapApifyToBenchmark(apifyData);

    json(response, 200, {
      connected: true,
      source: "apify_instagram_scraper",
      dateRange: { since, until },
      competitors: results,
      warnings,
    });
  } catch (error) {
    json(response, 500, { error: error.message || "Competitor benchmark failed via Apify." });
  }
}
