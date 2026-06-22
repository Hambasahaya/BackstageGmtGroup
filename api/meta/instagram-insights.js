import { findInstagramPage, getStoredTokenBundle, json, metaFetch } from "./_meta-client.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getDefaultDateRange = () => {
  const insightDays = Math.max(1, Math.min(Number(process.env.META_INSIGHT_DAYS || 30), 90));
  const untilDate = new Date();
  const sinceDate = new Date(untilDate);
  sinceDate.setUTCDate(sinceDate.getUTCDate() - (insightDays - 1));

  return {
    since: sinceDate.toISOString().slice(0, 10),
    until: untilDate.toISOString().slice(0, 10),
  };
};

const parseDateRange = (requestUrl) => {
  const defaults = getDefaultDateRange();
  const since = requestUrl.searchParams.get("since") || defaults.since;
  const until = requestUrl.searchParams.get("until") || defaults.until;

  if (!DATE_PATTERN.test(since) || !DATE_PATTERN.test(until)) {
    throw new Error("Format tanggal harus YYYY-MM-DD.");
  }

  const sinceTime = Date.parse(`${since}T00:00:00Z`);
  const untilTime = Date.parse(`${until}T00:00:00Z`);
  const rangeDays = Math.floor((untilTime - sinceTime) / (24 * 60 * 60 * 1000)) + 1;

  if (!Number.isFinite(sinceTime) || !Number.isFinite(untilTime) || rangeDays < 1) {
    throw new Error("Tanggal mulai tidak boleh melewati tanggal akhir.");
  }

  if (rangeDays > 90) {
    throw new Error("Rentang tanggal maksimal 90 hari.");
  }

  return { since, until };
};

const normalizeInsightItem = (item, until) => {
  const breakdownTotal = item.total_value?.breakdowns
    ?.flatMap((breakdown) => breakdown.results || [])
    .reduce((total, result) => total + (Number(result.value) || 0), 0);
  const objectValueTotal = item.total_value?.value && typeof item.total_value.value === "object"
    ? Object.values(item.total_value.value).reduce((total, value) => total + (Number(value) || 0), 0)
    : undefined;
  const totalValue = breakdownTotal ?? objectValueTotal ?? item.total_value?.value ?? item.total_value;
  const values = item.values?.length
    ? item.values
    : totalValue !== undefined
      ? [{ value: totalValue, end_time: `${until}T00:00:00+0000` }]
      : [];

  return { ...item, values };
};

const normalizeInsightPayload = (payload, until) =>
  (payload.data || []).map((item) => normalizeInsightItem(item, until));

const getBreakdownResults = (payload) => {
  const breakdowns = payload.data?.[0]?.total_value?.breakdowns || [];
  return breakdowns.flatMap((breakdown) => breakdown.results || []);
};

const sortBreakdown = (items) =>
  items
    .filter((item) => item.label && Number.isFinite(item.value))
    .sort((first, second) => second.value - first.value);

const normalizeOnlineFollowers = (payload) => {
  const insight = payload.data?.[0] || {};
  const directValue = insight.values?.at(-1)?.value
    ?? insight.total_value?.value
    ?? insight.total_value;
  const breakdownResults = getBreakdownResults(payload);

  if (breakdownResults.length) {
    return breakdownResults
      .map((item) => {
        const hour = item.dimension_values?.at(-1) ?? item.dimension_values?.[0] ?? item.label;
        return {
          label: `${String(hour).padStart(2, "0")}:00`,
          value: Number(item.value) || 0,
        };
      })
      .filter((item) => item.value > 0)
      .sort((first, second) => second.value - first.value);
  }

  if (directValue && typeof directValue === "object") {
    return Object.entries(directValue)
      .map(([hour, value]) => ({
        label: `${String(hour).padStart(2, "0")}:00`,
        value: Number(value) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((first, second) => second.value - first.value);
  }

  return [];
};

const getOnlineFollowers = async ({ igUserId, accessToken }) => {
  const attempts = [
    { metric: "online_followers", period: "lifetime" },
    { metric: "online_followers", period: "lifetime", metric_type: "total_value" },
    { metric: "online_followers", period: "day" },
  ];

  for (const params of attempts) {
    try {
      const payload = await metaFetch(`/${igUserId}/insights`, params, accessToken);
      const normalized = normalizeOnlineFollowers(payload);
      if (normalized.length) return { data: normalized, warning: null };
    } catch {
      // Some Meta accounts do not expose online followers. This is non-critical
      // because the dashboard can fall back to best posting times from content.
    }
  }

  return { data: [], warning: null };
};

const getFollowerDemographic = async ({ igUserId, accessToken, breakdown }) => {
  const payload = await metaFetch(
    `/${igUserId}/insights`,
    {
      metric: "follower_demographics",
      period: "lifetime",
      metric_type: "total_value",
      breakdown,
    },
    accessToken,
  );

  return getBreakdownResults(payload);
};

const getAudienceInsights = async ({ igUserId, accessToken }) => {
  const warnings = [];
  const demographics = {
    age: [],
    gender: [],
    city: [],
    country: [],
  };
  let onlineFollowers = [];

  const onlineResult = await getOnlineFollowers({ igUserId, accessToken });
  onlineFollowers = onlineResult.data;
  if (onlineResult.warning) warnings.push(onlineResult.warning);

  try {
    const ageGender = await getFollowerDemographic({ igUserId, accessToken, breakdown: "age,gender" });
    const ageMap = new Map();
    const genderMap = new Map();

    for (const item of ageGender) {
      const [age, gender] = item.dimension_values || [];
      const value = Number(item.value) || 0;
      if (age) ageMap.set(age, (ageMap.get(age) || 0) + value);
      if (gender) genderMap.set(gender, (genderMap.get(gender) || 0) + value);
    }

    demographics.age = sortBreakdown(Array.from(ageMap.entries()).map(([label, value]) => ({ label, value })));
    demographics.gender = sortBreakdown(Array.from(genderMap.entries()).map(([label, value]) => ({ label, value })));
  } catch (error) {
    warnings.push(`follower_demographics age,gender: ${error.message}`);
  }

  for (const breakdown of ["city", "country"]) {
    try {
      const results = await getFollowerDemographic({ igUserId, accessToken, breakdown });
      demographics[breakdown] = sortBreakdown(results.map((item) => ({
        label: item.dimension_values?.[0],
        value: Number(item.value) || 0,
      })));
    } catch (error) {
      warnings.push(`follower_demographics ${breakdown}: ${error.message}`);
    }
  }

  return {
    data: { onlineFollowers, demographics },
    warning: warnings.length ? warnings.join(" | ") : null,
  };
};

const getInsightMetrics = async ({ igUserId, accessToken, since, until }) => {
  const validAccountMetrics = new Set([
    "reach",
    "follower_count",
    "website_clicks",
    "profile_views",
    "online_followers",
    "accounts_engaged",
    "total_interactions",
    "likes",
    "comments",
    "shares",
    "saves",
    "replies",
    "engaged_audience_demographics",
    "reached_audience_demographics",
    "follower_demographics",
    "follows_and_unfollows",
    "profile_links_taps",
    "views",
    "content_views",
  ]);
  const configuredMetrics = (process.env.META_ACCOUNT_INSIGHT_METRICS || "reach,profile_views,website_clicks,profile_links_taps,follower_count,views")
    .split(",")
    .map((metric) => metric.trim())
    .filter((metric) => validAccountMetrics.has(metric));
  // `views` replaces the legacy `impressions` account metric on newer Graph API versions.
  const dashboardMetrics = [
    "follower_count",
    "reach",
    "views",
    "profile_views",
    "website_clicks",
    "profile_links_taps",
  ];
  const metrics = [...new Set([...configuredMetrics, ...dashboardMetrics])];
  const results = await Promise.all(metrics.map(async (metric) => {
    try {
      const payload = await metaFetch(
        `/${igUserId}/insights`,
        {
          metric,
          period: "day",
          since,
          until,
        },
        accessToken,
      );
      return { data: normalizeInsightPayload(payload, until), warning: null };
    } catch (error) {
      return { data: [], warning: `${metric}: ${error.message}` };
    }
  }));
  const profileViewAttempts = [
    { metric: "profile_views", period: "day", since, until, metric_type: "total_value" },
    { metric: "profile_views", period: "lifetime", metric_type: "total_value" },
  ];
  const profileViewResults = await Promise.all(profileViewAttempts.map(async (params) => {
    try {
      const payload = await metaFetch(`/${igUserId}/insights`, params, accessToken);
      return { data: normalizeInsightPayload(payload, until), warning: null };
    } catch {
      return { data: [], warning: null };
    }
  }));

  return {
    data: [
      ...results.flatMap((result) => result.data),
      ...profileViewResults.flatMap((result) => result.data),
    ],
    warning: results.map((result) => result.warning).filter(Boolean).join(" | ") || null,
  };
};

const getMediaInsightMetrics = async ({ mediaId, accessToken, metrics }) => {
  const results = await Promise.all(metrics.map(async (metric) => {
    try {
      const payload = await metaFetch(`/${mediaId}/insights`, { metric }, accessToken);
      return { data: normalizeInsightPayload(payload, new Date().toISOString().slice(0, 10)), warning: null };
    } catch (error) {
      return { data: [], warning: `${metric}: ${error.message}` };
    }
  }));

  return {
    data: results.flatMap((result) => result.data),
    warnings: results.map((result) => result.warning).filter((warning) => {
      if (!warning) return false;
      return ![
        "does not support",
        "must be one of the following values",
      ].some((message) => warning.includes(message));
    }),
  };
};

const enrichMediaInsights = async (mediaItems, accessToken) => {
  const videoMetrics = [
    "views",
    "shares",
    "ig_reels_avg_watch_time",
    "ig_reels_video_view_total_time",
  ];
  const warnings = [];
  const enriched = await Promise.all(mediaItems.map(async (media) => {
    const isVideo = media.media_type === "VIDEO" || media.media_product_type === "REELS";
    const isStory = media.media_product_type === "STORY";
    const metrics = isStory
      ? ["views", "reach", "replies"]
      : isVideo
        ? videoMetrics
        : ["views", "shares"];
    const extra = await getMediaInsightMetrics({ mediaId: media.id, accessToken, metrics });
    warnings.push(...extra.warnings);
    const existing = media.insights?.data || [];
    const extraNames = new Set(extra.data.map((item) => item.name));

    return {
      ...media,
      insights: { data: [...existing.filter((item) => !extraNames.has(item.name)), ...extra.data] },
    };
  }));

  return { data: enriched, warnings };
};

const getRecentMedia = async ({ igUserId, accessToken, since, until }) => {
  try {
    const [mediaPayload, storiesPayload] = await Promise.all([
      metaFetch(
      `/${igUserId}/media`,
      {
        fields:
          "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,insights.metric(reach,total_interactions,saved)",
        limit: Math.max(1, Math.min(Number(process.env.META_MEDIA_LIMIT || 25), 100)),
        since,
        until,
      },
      accessToken,
      ),
      metaFetch(
        `/${igUserId}/stories`,
        { fields: "id,caption,media_type,media_product_type,permalink,timestamp" },
        accessToken,
      ).catch((error) => ({ data: [], warning: `stories: ${error.message}` })),
    ]);
    const isInsideRange = (item) => {
      const date = item.timestamp?.slice(0, 10);
      return !date || (date >= since && date <= until);
    };
    const media = (mediaPayload.data || []).filter(isInsideRange);
    const knownIds = new Set(media.map((item) => item.id));
    const stories = (storiesPayload.data || [])
      .filter((item) => !knownIds.has(item.id))
      .filter(isInsideRange)
      .map((item) => ({ ...item, media_product_type: "STORY" }));
    const enriched = await enrichMediaInsights([...media, ...stories], accessToken);
    const uniqueWarnings = [...new Set([
      storiesPayload.warning,
      ...enriched.warnings,
    ].filter(Boolean))];

    return { data: enriched.data, warning: uniqueWarnings.join(" | ") || null };
  } catch (error) {
    return { data: [], warning: error.message };
  }
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
    const pageId = requestUrl.searchParams.get("pageId");
    const igUserIdParam = requestUrl.searchParams.get("igUserId");
    const dateRange = parseDateRange(requestUrl);
    const bundle = await getStoredTokenBundle();
    const page = findInstagramPage(bundle, pageId, igUserIdParam);

    if (!page?.instagram_business_account?.id || !page.access_token) {
      json(response, 404, {
        connected: false,
        error: "No connected Instagram Business account was found for the stored Meta token.",
      });
      return;
    }

    const igUserId = page.instagram_business_account.id;
    const [profile, insights, media, audience] = await Promise.all([
      metaFetch(
        `/${igUserId}`,
        {
          fields: "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website",
        },
        page.access_token,
      ),
      getInsightMetrics({ igUserId, accessToken: page.access_token, ...dateRange }),
      getRecentMedia({ igUserId, accessToken: page.access_token, ...dateRange }),
      getAudienceInsights({ igUserId, accessToken: page.access_token }),
    ]);

    json(response, 200, {
      connected: true,
      page: {
        id: page.id,
        name: page.name,
      },
      profile,
      dateRange,
      insights: insights.data || [],
      media: media.data || [],
      audience: audience.data,
      warnings: [insights.warning, media.warning, audience.warning].filter(Boolean),
    });
  } catch (error) {
    json(response, 500, { connected: false, error: error.message || "Instagram insights request failed." });
  }
}
