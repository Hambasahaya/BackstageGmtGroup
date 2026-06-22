import { findInstagramPage, getStoredTokenBundle, json, metaFetch } from "./_meta-client.js";

const getInsightMetrics = async ({ igUserId, accessToken }) => {
  const configuredMetrics = (process.env.META_ACCOUNT_INSIGHT_METRICS || "reach,profile_views,website_clicks,profile_links_taps,email_contacts,phone_call_clicks,text_message_clicks,get_directions_clicks,follower_count,views")
    .split(",")
    .map((metric) => metric.trim())
    .filter(Boolean);
  // `views` replaces the legacy `impressions` account metric on newer Graph API
  // versions. Keep both requested metrics when explicitly configured, but always
  // include the values needed by the dashboard cards.
  const dashboardMetrics = [
    "follower_count",
    "views",
    "website_clicks",
    "profile_links_taps",
    "email_contacts",
    "phone_call_clicks",
    "text_message_clicks",
    "get_directions_clicks",
  ];
  const metrics = [...new Set([...configuredMetrics, ...dashboardMetrics])];
  const insightDays = Math.max(1, Math.min(Number(process.env.META_INSIGHT_DAYS || 30), 90));
  const since = new Date(Date.now() - insightDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const results = await Promise.all(metrics.map(async (metric) => {
    try {
      const payload = await metaFetch(
        `/${igUserId}/insights`,
        { metric, period: "day", since },
        accessToken,
      );
      return { data: payload.data || [], warning: null };
    } catch (error) {
      return { data: [], warning: `${metric}: ${error.message}` };
    }
  }));

  return {
    data: results.flatMap((result) => result.data),
    warning: results.map((result) => result.warning).filter(Boolean).join(" | ") || null,
  };
};

const getMediaInsightMetrics = async ({ mediaId, accessToken, metrics }) => {
  const results = await Promise.all(metrics.map(async (metric) => {
    try {
      const payload = await metaFetch(`/${mediaId}/insights`, { metric }, accessToken);
      return { data: payload.data || [], warning: null };
    } catch (error) {
      return { data: [], warning: `${metric}: ${error.message}` };
    }
  }));

  return {
    data: results.flatMap((result) => result.data),
    warnings: results.map((result) => result.warning).filter(Boolean),
  };
};

const enrichMediaInsights = async (mediaItems, accessToken) => {
  const extraMetrics = [
    "views",
    "plays",
    "ig_reels_avg_watch_time",
    "ig_reels_video_view_total_time",
    "profile_activity",
  ];
  const warnings = [];
  const enriched = await Promise.all(mediaItems.map(async (media) => {
    const isVideo = media.media_type === "VIDEO" || media.media_product_type === "REELS";
    const isStory = media.media_product_type === "STORY";
    if (!isVideo && !isStory) return media;

    const metrics = isStory
      ? ["views", "reach", "replies", "profile_activity"]
      : extraMetrics;
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

const getRecentMedia = async ({ igUserId, accessToken }) => {
  try {
    const [mediaPayload, storiesPayload] = await Promise.all([
      metaFetch(
      `/${igUserId}/media`,
      {
        fields:
          "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,insights.metric(reach,total_interactions,saved)",
        limit: Math.max(1, Math.min(Number(process.env.META_MEDIA_LIMIT || 25), 100)),
      },
      accessToken,
      ),
      metaFetch(
        `/${igUserId}/stories`,
        { fields: "id,caption,media_type,media_product_type,permalink,timestamp" },
        accessToken,
      ).catch((error) => ({ data: [], warning: `stories: ${error.message}` })),
    ]);
    const media = mediaPayload.data || [];
    const knownIds = new Set(media.map((item) => item.id));
    const stories = (storiesPayload.data || [])
      .filter((item) => !knownIds.has(item.id))
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
    const [profile, insights, media] = await Promise.all([
      metaFetch(
        `/${igUserId}`,
        {
          fields: "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website",
        },
        page.access_token,
      ),
      getInsightMetrics({ igUserId, accessToken: page.access_token }),
      getRecentMedia({ igUserId, accessToken: page.access_token }),
    ]);

    json(response, 200, {
      connected: true,
      page: {
        id: page.id,
        name: page.name,
      },
      profile,
      insights: insights.data || [],
      media: media.data || [],
      warnings: [insights.warning, media.warning].filter(Boolean),
    });
  } catch (error) {
    json(response, 500, { connected: false, error: error.message || "Instagram insights request failed." });
  }
}
