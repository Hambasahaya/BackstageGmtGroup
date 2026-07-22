import { findInstagramPage, getStoredTokenBundle, json, metaFetch } from "./_meta-client.js";
import { buildContentBriefMessages, buildContentBriefPrompt, getContentBriefConfig } from "./_content-brief-config.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isLouderTechnologiesAccount = (account = {}) => {
  const accountText = [
    account.username,
    account.name,
    account.biography,
    account.website,
  ].filter(Boolean).join(" ").toLowerCase();

  return /louder\s*technologies|loudertechnologies|louder-technologies/.test(accountText);
};

const getLouderTechnologiesInstructions = () => [
  "Special rule for LouderTechnologies only:",
  "Write all generated content in English with simple, easy-to-understand grammar.",
  "Use a Human Experience First approach: start from real user needs, daily problems, project situations, or product challenges.",
  "Include Technical Experience, but explain it in a clear and light way. Avoid heavy technical language unless it is needed.",
  "Connect the story to a specific LouderTechnologies product, system, feature, project, or solution. Avoid generic content.",
  "Make the content relatable by using realistic work, customer, project, or industry situations.",
  "Use storytelling based on the project or product: problem, situation, solution, and result.",
  "Keep the tone professional, helpful, practical, and easy to follow.",
];

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

const toNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value && typeof value === "object") {
    const total = Object.values(value).reduce((sum, item) => sum + (Number(item) || 0), 0);
    return Number.isFinite(total) ? total : undefined;
  }
  return undefined;
};

const getMediaMetricValue = (media, ...names) =>
  toNumber(media.insights?.data?.find((item) => names.includes(item.name))?.values?.at(-1)?.value);

const getContentType = (media) => {
  if (media.media_product_type === "REELS") return "Reels";
  if (media.media_product_type === "STORY") return "Story";
  if (media.media_type === "CAROUSEL_ALBUM") return "Carousel";
  return media.media_type || "POST";
};

const buildLocalContentReasoning = ({ reach, views, interactions, engagementRate, saves, shares, contentType }) => {
  const notes = [];

  if (engagementRate !== undefined) {
    if (engagementRate >= 0.1) notes.push("Engagement tinggi; konten kuat untuk dijadikan referensi format berikutnya.");
    else if (engagementRate >= 0.03) notes.push("Engagement cukup stabil; pertahankan tema dan optimalkan hook/caption.");
    else notes.push("Engagement rendah; perlu perbaikan hook, visual awal, atau CTA.");
  } else if (reach > 0) {
    notes.push("Reach ada, tetapi interaksi terbatas sehingga kualitas respons audiens perlu dicek.");
  } else {
    notes.push("Data reach belum cukup; evaluasi setelah insight konten tersedia.");
  }

  if (views > reach && views > 0) notes.push("Views lebih besar dari reach, indikasi ada repeat view atau konsumsi ulang.");
  else if (reach > 0 && interactions > 0) notes.push("Konten mendapat respons organik dari audiens yang melihat.");
  if (saves > 0) notes.push("Ada saves, menandakan konten bernilai untuk disimpan.");
  if (shares > 0) notes.push("Ada shares, menandakan konten cukup relevan untuk dibagikan.");
  if (contentType === "Reels" && views === 0) notes.push("Reels belum punya views terukur dari API untuk periode ini.");

  return notes.slice(0, 2).join(" ");
};

const getMediaReasoningPayload = (mediaItems) =>
  mediaItems.map((media) => {
    const reach = getMediaMetricValue(media, "reach", "accounts_reached") || 0;
    const likes = media.like_count || 0;
    const comments = media.comments_count || 0;
    const shares = getMediaMetricValue(media, "shares") || 0;
    const saves = getMediaMetricValue(media, "saved", "saves") || 0;
    const views = getMediaMetricValue(media, "impressions", "views", "plays") || 0;
    const interactions = getMediaMetricValue(media, "total_interactions") ?? (likes + comments + shares + saves);
    const engagementRate = reach ? interactions / reach : undefined;
    const contentType = getContentType(media);

    return {
      id: media.id,
      caption: (media.caption || "").slice(0, 700),
      contentType,
      mediaType: media.media_type,
      productType: media.media_product_type,
      postedAt: media.timestamp,
      permalink: media.permalink || "",
      metrics: {
        reach,
        views,
        likes,
        comments,
        shares,
        saves,
        interactions,
        engagementRate,
      },
      fallbackReasoning: buildLocalContentReasoning({
        reach,
        views,
        interactions,
        engagementRate,
        saves,
        shares,
        contentType,
      }),
    };
  });

const enrichMediaReasoning = async ({ mediaItems, profile, dateRange, skipAi, authHeader }) => {
  const mediaPayload = getMediaReasoningPayload(mediaItems);
  const fallbackById = new Map(mediaPayload.map((item) => [item.id, item.fallbackReasoning]));

  const igUserId = profile?.id;
  const since = dateRange?.since;
  const until = dateRange?.until;

  if (skipAi) {
    // Attempt to read cached reasoning via GET /api/meta/insights/reasoning
    if (igUserId && since && until) {
      try {
        const queryParams = new URLSearchParams({ ig_user_id: igUserId, since, until });
        const getUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/insights/reasoning?${queryParams.toString()}`;
        const getRes = await fetch(getUrl, {
          headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
        });

        if (getRes.ok) {
          const getPayload = await getRes.json();
          const items = Array.isArray(getPayload?.items) ? getPayload.items : [];
          if (items.length > 0) {
            const reasoningById = new Map(
              items
                .filter((item) => item?.id && (typeof item.reasoning === "string" || item.status || item.action))
                .map((item) => [String(item.id), item]),
            );

            return {
              data: mediaItems.map((media) => {
                const reasoning = reasoningById.get(String(media.id));
                return {
                  ...media,
                  ai_reasoning: reasoning?.reasoning || fallbackById.get(media.id),
                  ai_action: reasoning?.action,
                  ai_angle: reasoning?.angle,
                  ai_status: reasoning?.status,
                  ai_reasoning_source: reasoning?.reasoning ? "sosmed_agent_claude" : "local",
                };
              }),
              warning: null,
            };
          }
        }
      } catch (getErr) {
        console.warn("[skipAi] Failed to fetch cached reasoning, using local fallback:", getErr.message);
      }
    }

    return {
      data: mediaItems.map((media) => ({
        ...media,
        ai_reasoning: fallbackById.get(media.id),
        ai_reasoning_source: "local",
      })),
      warning: null,
    };
  }

  // Filter posts to only include the last 7 days to save LLM tokens and prevent timeouts.
  const now = Date.now();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const recentPosts = mediaPayload.filter(item => {
    if (!item.postedAt) return false;
    const postTime = new Date(item.postedAt).getTime();
    return (now - postTime) <= sevenDaysInMs;
  });

  if (recentPosts.length === 0) {
    return {
      data: mediaItems.map((media) => ({
        ...media,
        ai_reasoning: fallbackById.get(media.id),
        ai_reasoning_source: "local",
      })),
      warning: null,
    };
  }

  try {
    const postResponse = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/meta/insights/reasoning`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify({
        ig_user_id: igUserId,
        dateRange,
        account: {
          username: profile?.username,
          name: profile?.name,
          biography: profile?.biography,
          followers_count: profile?.followers_count,
          website: profile?.website
        },
        posts: recentPosts
      })
    });

    let items = [];
    if (postResponse.ok) {
      const postPayload = await postResponse.json();
      items = Array.isArray(postPayload?.rows) && postPayload.rows.length
        ? postPayload.rows
        : Array.isArray(postPayload?.items)
          ? postPayload.items
          : [];
    } else {
      const errorText = await postResponse.text();
      console.error("Insights reasoning POST failed:", postResponse.status, errorText);
    }

    const reasoningById = new Map(
      items
        .filter((item) => item?.id && (typeof item.reasoning === "string" || item.status || item.action))
        .map((item) => [String(item.id), item]),
    );

    return {
      data: mediaItems.map((media) => {
        const reasoning = reasoningById.get(String(media.id));
        return {
          ...media,
          ai_reasoning: reasoning?.reasoning || fallbackById.get(media.id),
          ai_action: reasoning?.action,
          ai_angle: reasoning?.angle,
          ai_status: reasoning?.status,
          ai_reasoning_source: reasoning?.reasoning ? "sosmed_agent_claude" : "local",
        };
      }),
      warning: null,
    };
  } catch (error) {
    return {
      data: mediaItems.map((media) => ({
        ...media,
        ai_reasoning: fallbackById.get(media.id),
        ai_reasoning_source: "local",
      })),
      warning: `Backend reasoning fallback: ${error.message}`,
    };
  }
};

const getContentBrief = async ({ profile, dateRange, mediaItems, audience, igUserId, authHeader }) => {
  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/meta/insights/content-brief`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify({
        profile,
        dateRange,
        mediaPayload: getMediaReasoningPayload(mediaItems),
        audience,
        references: getConfiguredReferences({ igUserId, username: profile?.username })
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const payload = await response.json();
    return {
      contentBrief: payload?.contentBrief || null,
      warning: null
    };
  } catch (error) {
    return {
      contentBrief: null,
      warning: `Backend content brief fallback: ${error.message}`,
    };
  }
};

const getReferenceInsights = async ({ profile, igUserId, recentPosts, authHeader }) => {
  const references = getConfiguredReferences({ igUserId, username: profile?.username });
  if (!references.length) return { data: [], warning: null };

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/meta/insights/references-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify({
        profile,
        igUserId,
        references,
        recentPosts
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const payload = await response.json();
    return {
      data: Array.isArray(payload?.data) ? payload.data : [],
      warning: null
    };
  } catch (error) {
    return {
      data: references.map((reference, index) => ({
        ...reference,
        title: reference.title || `Referensi ${index + 1}`,
        hook: "",
        style: "",
        reasoning: reference.note || "Referensi custom tersedia, tetapi analisis backend belum berhasil dimuat.",
        action: "",
        pillar: "",
        source: "local",
      })),
      warning: `Backend reference fallback: ${error.message}`,
    };
  }
};


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
    ageGender: [],
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
    const ageGenderMap = new Map();

    for (const item of ageGender) {
      const [age, gender] = item.dimension_values || [];
      const value = Number(item.value) || 0;
      if (age) ageMap.set(age, (ageMap.get(age) || 0) + value);
      if (gender) genderMap.set(gender, (genderMap.get(gender) || 0) + value);
      if (age && gender) {
        const label = `${age}.${gender}`;
        ageGenderMap.set(label, (ageGenderMap.get(label) || 0) + value);
      }
    }

    demographics.ageGender = sortBreakdown(Array.from(ageGenderMap.entries()).map(([label, value]) => ({ label, value })));
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
  const configuredMetrics = (process.env.META_ACCOUNT_INSIGHT_METRICS || "reach,profile_views,website_clicks,profile_links_taps,follower_count,follows_and_unfollows,views")
    .split(",")
    .map((metric) => metric.trim())
    .filter((metric) => validAccountMetrics.has(metric));
  // `views` replaces the legacy `impressions` account metric on newer Graph API versions.
  const dashboardMetrics = [
    "follower_count",
    "follows_and_unfollows",
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
          "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,comments.limit(50){id,text,username,timestamp},insights.metric(reach,total_interactions,saved)",
        limit: Math.max(1, Math.min(Number(process.env.META_MEDIA_LIMIT || 25), 100)),
        since,
        until,
      },
      accessToken,
      ),
      metaFetch(
        `/${igUserId}/stories`,
        { fields: "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp" },
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


const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Returns the configured content references for a given IG account.
 * References are read from the META_CONTENT_REFERENCES env variable (JSON array).
 * Each entry can match by igUserId or username.
 */
const getConfiguredReferences = ({ igUserId, username } = {}) => {
  const raw = process.env.META_CONTENT_REFERENCES || "";
  if (!raw.trim()) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  // Find the entry that matches this account
  const entry = parsed.find((item) => {
    if (igUserId && item.igUserId === igUserId) return true;
    if (username && item.username === username) return true;
    return false;
  });

  if (!entry) return [];

  const refs = entry.references || [];
  return refs.map((ref, index) => {
    if (typeof ref === "string") {
      return { id: `ref-${index + 1}`, url: ref, contentType: "Post", note: "" };
    }
    return {
      id: ref.id || `ref-${index + 1}`,
      url: ref.url || ref.accountUrl || "",
      contentType: ref.contentType || "Post",
      note: ref.note || "",
    };
  }).filter((ref) => ref.url);
};

const mapInsightsToDashboardDb = (profile, insights, mediaWithReasoning, audience, contentBrief, contentReferences, dateRange) => {
  const mediaItems = mediaWithReasoning.data || [];
  const insightsItems = insights.data || [];
  
  const getMetricSum = (name) => {
    const metric = insightsItems.find(item => item.name === name);
    if (!metric || !Array.isArray(metric.values)) return 0;
    return metric.values.reduce((sum, v) => {
      const val = typeof v.value === "object" 
        ? Object.values(v.value).reduce((s, x) => s + (Number(x) || 0), 0) 
        : Number(v.value) || 0;
      return sum + val;
    }, 0);
  };

  const reach = getMetricSum("reach");
  const impressions = getMetricSum("views") || getMetricSum("impressions");
  const profileViews = getMetricSum("profile_views");
  const followersGrowth = getMetricSum("follower_count") || getMetricSum("follows_and_unfollows");
  
  const posts = mediaItems.map(item => {
    const reachVal = getMediaMetricValue(item, "reach", "accounts_reached") || 0;
    const likesVal = item.like_count || 0;
    const commentsVal = item.comments_count || 0;
    const sharesVal = getMediaMetricValue(item, "shares") || 0;
    const savesVal = getMediaMetricValue(item, "saved", "saves") || 0;
    const viewsVal = getMediaMetricValue(item, "impressions", "views", "plays") || 0;
    const watchTimeVal = getMediaMetricValue(item, "ig_reels_video_view_total_time") || 0;
    const interactionsVal = getMediaMetricValue(item, "total_interactions") ?? (likesVal + commentsVal + sharesVal + savesVal);
    const engagementRateVal = reachVal ? (interactionsVal / reachVal) * 100 : 0;
    
    const isAiReasoning = Boolean(item.ai_reasoning_source && item.ai_reasoning_source !== "local");
    const reasoningVal = isAiReasoning ? (item.ai_reasoning || "") : "";

    return {
      id: String(item.id),
      caption: item.caption || "",
      media_type: item.media_type || "IMAGE",
      contentType: getContentType(item),
      type: getContentType(item),
      permalink: item.permalink || "",
      link: item.permalink || "",
      timestamp: item.timestamp || "",
      reach: reachVal,
      views: viewsVal,
      likes: likesVal,
      comments: commentsVal,
      shares: sharesVal,
      saves: savesVal,
      engagement_rate: Math.round(engagementRateVal * 100) / 100,
      reasoning: reasoningVal,
      action: isAiReasoning ? (item.ai_action || "") : "",
      angle: isAiReasoning ? (item.ai_angle || "") : "",
      status: isAiReasoning ? (item.ai_status || "") : "",
      metrics: {
        reach: reachVal,
        views: viewsVal,
        likes: likesVal,
        comments: commentsVal,
        shares: sharesVal,
        saves: savesVal,
        watch_time: watchTimeVal,
      }
    };
  });

  const avgEngagementRate = posts.length ? posts.reduce((sum, c) => sum + c.engagement_rate, 0) / posts.length : 0;
  const followers = profile.followers_count || 0;
  const followerGrowthRate = followers ? (followersGrowth / followers) * 100 : 0;

  const hashtagsMap = new Map();
  posts.forEach(item => {
    const tags = item.caption.match(/#[a-zA-Z0-9_]+/g) || [];
    tags.forEach(tag => {
      const normalized = tag.toLowerCase();
      const current = hashtagsMap.get(normalized) || { hashtag: tag, used: 0, total_reach: 0, total_engagement: 0 };
      current.used += 1;
      current.total_reach += item.reach;
      current.total_engagement += item.engagement_rate;
      hashtagsMap.set(normalized, current);
    });
  });
  const hashtagPerformance = Array.from(hashtagsMap.values()).map(h => ({
    hashtag: h.hashtag,
    used: h.used,
    avg_reach: h.used ? Math.round(h.total_reach / h.used) : 0,
    avg_engagement: h.used ? Math.round((h.total_engagement / h.used) * 100) / 100 : 0
  })).sort((a, b) => b.used - a.used).slice(0, 10);

  let bestTime = { day: "Tuesday", hour: "19:00" };
  const onlineFollowers = audience?.onlineFollowers || [];
  if (onlineFollowers.length) {
    const topTime = onlineFollowers[0];
    bestTime = { day: "Everyday", hour: topTime.label || "19:00" };
  }

  const contentCalendar = (contentBrief?.contentBrief?.items || contentBrief?.items || []).map(item => ({
    day: item.day,
    format: item.format,
    idea: item.idea,
    objective: item.objective || "Engagement"
  }));

  const audienceObj = {
    age: audience?.demographics?.age || [],
    gender: audience?.demographics?.gender || [],
    city: audience?.demographics?.city || [],
    country: audience?.demographics?.country || []
  };

  return {
    ig_user_id: String(profile.id),
    ig_username: profile.username || "",
    dateRange: {
      since: dateRange.since,
      until: dateRange.until,
    },
    since: dateRange.since,
    until: dateRange.until,
    followers,
    reach,
    impressions,
    content_count: profile.media_count || mediaItems.length,
    followers_growth: followersGrowth,
    follows_count: profile.follows_count || 0,
    profile_views: profileViews,
    account_reach: reach,
    account_impressions: impressions,
    avg_engagement_rate: Math.round(avgEngagementRate * 100) / 100,
    follower_growth_rate: Math.round(followerGrowthRate * 100) / 100,
    audience: audienceObj,
    audience_demographics: audienceObj,
    posts: posts,
    content: posts,
    best_time_to_post: bestTime,
    frequency_correlation: {
      summary: `Posting ${Math.round((mediaItems.length / 4) * 10) / 10}x/minggu memberi engagement stabil.`
    },
    hashtag_performance: hashtagPerformance,
    content_calendar: contentCalendar
  };
};

const mapDashboardDbToInsights = (dbData, pageId, pageName) => {
  const dateRange = {
    since: dbData.dateRange?.since || dbData.since,
    until: dbData.dateRange?.until || dbData.until
  };
  const profile = {
    id: dbData.ig_user_id,
    username: dbData.ig_username,
    name: dbData.ig_username,
    biography: "",
    followers_count: dbData.followers,
    follows_count: dbData.follows_count || 0,
    media_count: dbData.content_count || dbData.posts?.length || dbData.content?.length || 0,
    profile_picture_url: "",
    website: ""
  };

  const insights = [
    {
      name: "reach",
      period: "day",
      values: [{ value: dbData.reach, end_time: `${dateRange.until}T00:00:00+0000` }]
    },
    {
      name: "views",
      period: "day",
      values: [{ value: dbData.impressions, end_time: `${dateRange.until}T00:00:00+0000` }]
    },
    {
      name: "profile_views",
      period: "day",
      values: [{ value: dbData.profile_views, end_time: `${dateRange.until}T00:00:00+0000` }]
    },
    {
      name: "follower_count",
      period: "day",
      values: [{ value: dbData.followers_growth, end_time: `${dateRange.until}T00:00:00+0000` }]
    }
  ];

  const postsList = dbData.posts || dbData.content || [];
  const media = postsList.map(item => {
    const reachVal = item.metrics?.reach ?? item.reach ?? 0;
    const viewsVal = item.metrics?.views ?? item.views ?? 0;
    const sharesVal = item.metrics?.shares ?? item.shares ?? 0;
    const savesVal = item.metrics?.saves ?? item.saves ?? 0;
    const likesVal = item.metrics?.likes ?? item.likes ?? 0;
    const commentsVal = item.metrics?.comments ?? item.comments ?? 0;
    const itemType = item.contentType || item.type || "Feed";

    const insightsData = [
      { name: "reach", values: [{ value: reachVal }] },
      { name: "views", values: [{ value: viewsVal }] },
      { name: "shares", values: [{ value: sharesVal }] },
      { name: "saves", values: [{ value: savesVal }] }
    ];

    return {
      id: String(item.id),
      caption: item.caption,
      media_type: item.media_type || (itemType === "Carousel" ? "CAROUSEL_ALBUM" : itemType === "Reels" ? "VIDEO" : "IMAGE"),
      media_product_type: itemType === "Reels" ? "REELS" : itemType === "Story" ? "STORY" : "FEED",
      permalink: item.permalink || item.link || "",
      timestamp: item.timestamp || "",
      like_count: likesVal,
      comments_count: commentsVal,
      ai_reasoning: item.reasoning || item.ai_reasoning || "",
      ai_action: item.action || item.ai_action || "",
      ai_angle: item.angle || item.ai_angle || "",
      ai_status: item.status || item.ai_status || "",
      ai_reasoning_source: (item.reasoning || item.ai_reasoning) ? "sosmed_agent_claude" : "local",
      insights: { data: insightsData }
    };
  });

  const onlineFollowers = dbData.best_time_to_post?.hour ? [{ label: dbData.best_time_to_post.hour, value: 100 }] : [];
  const audienceObj = dbData.audience || dbData.audience_demographics || {};
  const audience = {
    onlineFollowers,
    demographics: {
      age: audienceObj.age || [],
      gender: audienceObj.gender || [],
      city: audienceObj.city || [],
      country: audienceObj.country || []
    }
  };

  const contentCalendarItems = (dbData.content_calendar || []).map((item, idx) => ({
    day: item.day || `Hari ${idx + 1}`,
    format: item.format || "Feed",
    pillar: "",
    objective: item.objective || "Engagement",
    idea: item.idea || "",
    formatGuide: "",
    action: "",
    reason: "",
    impact: "",
    assistant: {
      formatType: item.format?.toLowerCase() === "reels" ? "video" : item.format?.toLowerCase() === "carousel" ? "carousel" : "feed",
      caption: { hook: "", body: "", cta: "", hashtags: [] },
      script: [],
      carouselSlides: [],
      storyFrames: [],
      visualDirection: "",
      shotList: [],
      publishChecklist: [],
      postPublishChecklist: []
    }
  }));

  const contentBrief = {
    source: "database",
    summary: dbData.frequency_correlation?.summary || "",
    items: contentCalendarItems
  };

  return {
    connected: true,
    skippedAi: false,
    page: {
      id: pageId,
      name: pageName
    },
    profile,
    dateRange,
    insights,
    media,
    audience,
    contentBrief,
    contentReferences: [],
    warnings: []
  };
};

/**
 * Fire-and-forget: build the DB payload and POST it to the backend store endpoint.
 * This does not block the API response — failures are logged but not surfaced to the caller.
 */
const storeDashboardData = ({ profile, insights, mediaWithReasoning, audience, contentBrief, contentReferences, dateRange, authHeader }) => {
  if (!authHeader) return;
  try {
    const payload = mapInsightsToDashboardDb(
      profile,
      insights,
      mediaWithReasoning,
      audience,
      contentBrief || { contentBrief: null },
      contentReferences || { data: [] },
      dateRange,
    );
    const storeUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/instagram-dashboard/store`;
    fetch(storeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify(payload),
    }).catch((err) => console.error("[store] Failed to persist dashboard data:", err.message));
  } catch (err) {
    console.error("[store] Failed to build dashboard payload:", err.message);
  }
};

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

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
    const skipAi = requestUrl.searchParams.get("skip_ai") === "true";
    const dateRange = parseDateRange(requestUrl);
    const bundle = await getStoredTokenBundle(request);
    const page = findInstagramPage(bundle, pageId, igUserIdParam);

    if (!page?.instagram_business_account?.id || !page.access_token) {
      json(response, 404, {
        connected: false,
        error: "No connected Instagram Business account was found for the stored Meta token.",
      });
      return;
    }

    const igUserId = page.instagram_business_account.id;

    // 1. Try to fetch dashboard data from backend database first
    let dbDashboardData = null;
    const authHeader = request.headers.authorization || request.headers.Authorization;
    if (authHeader) {
      try {
        const queryParams = new URLSearchParams({
          ig_user_id: igUserId,
          since: dateRange.since,
          until: dateRange.until
        });
        const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/instagram-dashboard?${queryParams.toString()}`;
        const dbResponse = await fetch(targetUrl, {
          headers: { Authorization: authHeader }
        });
        if (dbResponse.ok) {
          const payload = await dbResponse.json();
          if (payload?.success && payload?.data) {
            dbDashboardData = payload.data;
          }
        }
      } catch (dbError) {
        console.error("Failed to query instagram-dashboard from database:", dbError);
      }
    }

    if (dbDashboardData) {
      // Data exists in DB, map back to Insights and return immediately
      const mappedResponse = mapDashboardDbToInsights(dbDashboardData, page.id, page.name);
      json(response, 200, mappedResponse);
      return;
    }

    // 2. Database data is empty or range missing, proceed to query Meta Graph API directly
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

    // When skip_ai=true:
    // 1. Respond to FE immediately with Graph API data (fast load)
    // 2. Run the full AI pipeline in the background (fire-and-forget)
    // 3. When AI finishes, store the COMPLETE data (including AI reasoning + brief) to DB
    if (skipAi) {
      const mediaWithReasoning = await enrichMediaReasoning({
        mediaItems: media.data || [],
        profile,
        dateRange,
        skipAi: true,
        authHeader,
      });

      // Respond to FE immediately — do NOT wait for AI
      json(response, 200, {
        connected: true,
        skippedAi: true,
        page: {
          id: page.id,
          name: page.name,
        },
        profile,
        dateRange,
        insights: insights.data || [],
        media: mediaWithReasoning.data || [],
        audience: audience.data,
        contentBrief: null,
        contentReferences: [],
        warnings: [insights.warning, media.warning, mediaWithReasoning.warning, audience.warning].filter(Boolean),
      });

      // Background: run the full AI pipeline then store the complete result to DB.
      // This does NOT block or affect the response already sent above.
      Promise.all([
        enrichMediaReasoning({
          mediaItems: media.data || [],
          profile,
          dateRange,
          skipAi: false,   // ← full AI reasoning per post
          authHeader,
        }),
        getContentBrief({
          profile,
          dateRange,
          mediaItems: media.data || [],
          audience: audience.data,
          igUserId,
          authHeader,
        }),
        getReferenceInsights({
          profile,
          igUserId,
          recentPosts: getMediaReasoningPayload(media.data || []),
          authHeader,
        }),
      ])
        .then(([aiMedia, aiContentBrief, aiContentReferences]) => {
          storeDashboardData({
            profile,
            insights,
            mediaWithReasoning: aiMedia,
            audience,
            contentBrief: aiContentBrief,
            contentReferences: aiContentReferences,
            dateRange,
            authHeader,
          });
        })
        .catch((err) => {
          // If AI pipeline fails entirely, fall back to storing basic metrics
          console.error("[bg-ai] AI pipeline failed, storing basic metrics:", err.message);
          storeDashboardData({
            profile,
            insights,
            mediaWithReasoning,
            audience,
            contentBrief: null,
            contentReferences: null,
            dateRange,
            authHeader,
          });
        });

      return;
    }


    const [mediaWithReasoning, contentBrief, contentReferences] = await Promise.all([
      enrichMediaReasoning({
        mediaItems: media.data || [],
        profile,
        dateRange,
        skipAi: false,
        authHeader,
      }),
      getContentBrief({
        profile,
        dateRange,
        mediaItems: media.data || [],
        audience: audience.data,
        igUserId,
        authHeader,
      }),
      getReferenceInsights({
        profile,
        igUserId,
        recentPosts: getMediaReasoningPayload(media.data || []),
        authHeader,
      }),
    ]);

    const finalResponse = {
      connected: true,
      skippedAi: false,
      page: {
        id: page.id,
        name: page.name,
      },
      profile,
      dateRange,
      insights: insights.data || [],
      media: mediaWithReasoning.data || [],
      audience: audience.data,
      contentBrief: contentBrief.contentBrief,
      contentReferences: contentReferences.data,
      warnings: [insights.warning, media.warning, mediaWithReasoning.warning, contentBrief.warning, contentReferences.warning, audience.warning].filter(Boolean),
    };

    // 3. Map the calculated insights to the DB schema and store them in the backend database
    storeDashboardData({ profile, insights, mediaWithReasoning, audience, contentBrief, contentReferences, dateRange, authHeader });

    json(response, 200, finalResponse);
  } catch (error) {
    json(response, 500, { connected: false, error: error.message || "Instagram insights request failed." });
  }
}
