import { findInstagramPage, getStoredTokenBundle, json, metaFetch } from "./_meta-client.js";

const getInsightMetrics = async ({ igUserId, accessToken }) => {
  const metrics = (process.env.META_ACCOUNT_INSIGHT_METRICS || "reach,profile_views,website_clicks,follower_count")
    .split(",")
    .map((metric) => metric.trim())
    .filter(Boolean);
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

const getRecentMedia = async ({ igUserId, accessToken }) => {
  try {
    return await metaFetch(
      `/${igUserId}/media`,
      {
        fields:
          "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,insights.metric(reach,total_interactions,saved)",
        limit: Math.max(1, Math.min(Number(process.env.META_MEDIA_LIMIT || 25), 100)),
      },
      accessToken,
    );
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
