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

const extractJsonObject = (text) => {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;
  return JSON.parse(candidate.slice(start, end + 1));
};

const getAiProviderConfig = () => {
  const apiKey =
    process.env.ALIBABA_MODEL_STUDIO_API_KEY ||
    process.env.ALIBABA_API_KEY ||
    process.env.DASHSCOPE_API_KEY;

  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (process.env.ALIBABA_MODEL_STUDIO_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/$/, ""),
    model: process.env.ALIBABA_MODEL || "qwen-plus",
    source: "alibaba",
  };
};

const callAiJson = async ({ prompt, temperature, maxTokens }) => {
  const config = getAiProviderConfig();
  if (!config) return { parsed: null, source: "local" };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "You are a social media strategist. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature,
      max_tokens: maxTokens,
    }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || payload.message || "Alibaba Model Studio request failed.");
  }

  const text = payload.choices?.[0]?.message?.content || "";
  const parsed = extractJsonObject(text);
  if (!parsed) {
    throw new Error("Alibaba Model Studio returned an invalid JSON payload.");
  }

  return { parsed, source: config.source };
};

const callAlibabaForContentReasoning = async ({ profile, dateRange, mediaPayload }) => {
  if (!mediaPayload.length) return { items: [], warning: null, source: "local" };

  const prompt = [
    "You are applying the Social Media Manager skill for an Indonesian Instagram business dashboard.",
    "Act as a content strategist, not a caption writer. Evaluate each post using content pillars, audience value, engagement quality, format fit, posting cadence, and next optimization.",
    "Return only valid JSON. No markdown. No commentary.",
    "Schema: {\"items\":[{\"id\":\"media id\",\"reasoning\":\"1-2 concise Indonesian sentences for the dashboard table\",\"action\":\"short next action\",\"angle\":\"content angle or pillar\"}]}",
    "Reasoning must mention the useful metric pattern when available, and must not invent metrics not present in the input.",
    "Keep each reasoning under 220 characters.",
    JSON.stringify({
      account: {
        username: profile?.username,
        name: profile?.name,
        biography: profile?.biography,
        followers: profile?.followers_count,
        website: profile?.website,
      },
      dateRange,
      posts: mediaPayload,
    }),
  ].join("\n");

  const { parsed, source } = await callAiJson({ prompt, temperature: 0.35, maxTokens: 4096 });
  if (source === "local") return { items: [], warning: null, source };

  if (!Array.isArray(parsed?.items)) {
    throw new Error("Alibaba Model Studio returned an invalid content reasoning payload.");
  }

  return { items: parsed.items, warning: null, source };
};

const normalizeReferenceItem = (reference, index) => {
  if (typeof reference === "string") {
    return {
      id: `reference-${index + 1}`,
      url: reference,
      contentType: reference.includes("/reel/") ? "Reels" : reference.includes("/stories/") ? "Story" : "Reference",
      note: "",
    };
  }

  if (!reference || typeof reference !== "object") return null;

  return {
    id: reference.id || `reference-${index + 1}`,
    url: reference.url || reference.permalink || reference.accountUrl || "",
    accountUrl: reference.accountUrl || "",
    contentType: reference.contentType || reference.type || (reference.url?.includes("/reel/") ? "Reels" : "Reference"),
    title: reference.title || "",
    caption: reference.caption || "",
    note: reference.note || reference.reason || "",
  };
};

const getConfiguredReferences = ({ igUserId, username }) => {
  const raw = process.env.META_CONTENT_REFERENCES || process.env.INSTAGRAM_CONTENT_REFERENCES || "";
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const usernameKey = username?.toLowerCase();
    const candidates = Array.isArray(parsed)
      ? parsed
      : [
          ...(parsed[igUserId] || []),
          ...(usernameKey ? parsed[usernameKey] || [] : []),
          ...(username ? parsed[`@${usernameKey}`] || [] : []),
        ];
    const references = Array.isArray(parsed)
      ? candidates
          .filter((group) => {
            if (!group || typeof group !== "object") return false;
            const groupUsername = String(group.username || "").replace(/^@/, "").toLowerCase();
            return group.igUserId === igUserId || group.instagramUserId === igUserId || groupUsername === usernameKey;
          })
          .flatMap((group) => group.references || group.links || [])
      : candidates;

    return references
      .map(normalizeReferenceItem)
      .filter((item) => item?.url || item?.caption || item?.note)
      .slice(0, 6);
  } catch {
    return [];
  }
};

const getReferenceInsights = async ({ profile, igUserId, recentPosts }) => {
  const references = getConfiguredReferences({ igUserId, username: profile?.username });
  if (!references.length) return { data: [], warning: null };

  const prompt = [
    "You are applying the Social Media Manager skill for an Indonesian Instagram dashboard.",
    "Analyze the provided reference Instagram content/account links for the selected account.",
    "Important: if a reference only has a URL and no caption/note, do not pretend you can see the post. Infer only format from the URL when possible and give a practical creative-use reason.",
    "Return only valid JSON. No markdown. No commentary.",
    "Schema: {\"items\":[{\"id\":\"reference id\",\"title\":\"short title\",\"contentType\":\"Reels|Carousel|Story|Feed|Account\",\"hook\":\"hook/style to borrow\",\"style\":\"visual/copy style\",\"reasoning\":\"1-2 Indonesian sentences why this is useful for the selected account\",\"action\":\"how to adapt it\",\"pillar\":\"content pillar\"}]}",
    "Keep reasoning under 240 characters. Use Bahasa Indonesia.",
    JSON.stringify({
      selectedAccount: {
        igUserId,
        username: profile?.username,
        name: profile?.name,
        biography: profile?.biography,
      },
      references,
      recentPosts: recentPosts.slice(0, 6),
    }),
  ].join("\n");

  try {
    const { parsed, source } = await callAiJson({ prompt, temperature: 0.35, maxTokens: 4096 });
    if (source === "local") return { data: [], warning: null };

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const byId = new Map(items.map((item) => [item.id, item]));

    return {
      data: references.map((reference, index) => {
        const insight = byId.get(reference.id) || {};
        return {
          ...reference,
          title: insight.title || reference.title || `Referensi ${index + 1}`,
          contentType: insight.contentType || reference.contentType || "Reference",
          hook: insight.hook || "",
          style: insight.style || "",
          reasoning: insight.reasoning || reference.note || "Referensi custom untuk menjaga arah hook, gaya visual, dan angle konten akun ini.",
          action: insight.action || "",
          pillar: insight.pillar || "",
          source,
        };
      }),
      warning: null,
    };
  } catch (error) {
    return {
      data: references.map((reference, index) => ({
        ...reference,
        title: reference.title || `Referensi ${index + 1}`,
        hook: "",
        style: "",
        reasoning: reference.note || "Referensi custom tersedia, tetapi analisis Alibaba belum berhasil dimuat.",
        action: "",
        pillar: "",
        source: "local",
      })),
      warning: `Alibaba reference fallback: ${error.message}`,
    };
  }
};

const enrichMediaReasoning = async ({ mediaItems, profile, dateRange }) => {
  const mediaPayload = getMediaReasoningPayload(mediaItems);
  const fallbackById = new Map(mediaPayload.map((item) => [item.id, item.fallbackReasoning]));

  try {
    const ai = await callAlibabaForContentReasoning({ profile, dateRange, mediaPayload });
    const reasoningById = new Map(
      ai.items
        .filter((item) => item?.id && typeof item.reasoning === "string")
        .map((item) => [item.id, item]),
    );

    return {
      data: mediaItems.map((media) => {
        const reasoning = reasoningById.get(media.id);
        return {
          ...media,
          ai_reasoning: reasoning?.reasoning || fallbackById.get(media.id),
          ai_action: reasoning?.action,
          ai_angle: reasoning?.angle,
          ai_reasoning_source: reasoning?.reasoning ? ai.source : "local",
        };
      }),
      warning: ai.source === "alibaba" ? null : null,
    };
  } catch (error) {
    return {
      data: mediaItems.map((media) => ({
        ...media,
        ai_reasoning: fallbackById.get(media.id),
        ai_reasoning_source: "local",
      })),
      warning: `Alibaba reasoning fallback: ${error.message}`,
    };
  }
};

const callAlibabaForContentBrief = async ({ profile, dateRange, mediaPayload, audience }) => {
  if (!mediaPayload.length) return { contentBrief: null, warning: null };

  const prompt = [
    "You are applying the Social Media Manager skill for an Indonesian Instagram business dashboard.",
    "Create a tactical 7-day content brief and production-ready assistant package from the account profile, audience signals, and recent post metrics.",
    "Use the Social Media Manager skill principles: content pillars, audience value, growth objective, format fit, cadence, hook strategy, CTA, platform-native execution, and publish QA.",
    "Make the assistant package format-aware: Reels/video must include script and shot list; Carousel must include slide-by-slide outline; Story must include frame sequence; Feed/static must include visual direction.",
    "Return only valid JSON. No markdown. No commentary.",
    "Schema: {\"summary\":\"one concise Indonesian recommendation\",\"source\":\"alibaba\",\"items\":[{\"day\":\"Hari 1\",\"format\":\"Reels|Story|Carousel|Feed\",\"pillar\":\"content pillar\",\"objective\":\"metric/behavior objective\",\"idea\":\"specific Indonesian content idea\",\"formatGuide\":\"execution guide\",\"action\":\"what to do\",\"reason\":\"why this format/angle\",\"impact\":\"expected business/content impact\",\"assistant\":{\"formatType\":\"video|carousel|story|feed\",\"caption\":{\"hook\":\"\",\"body\":\"\",\"cta\":\"\",\"hashtags\":[\"\"]},\"script\":[{\"timecode\":\"0-3s\",\"visual\":\"\",\"voiceOver\":\"\",\"onScreenText\":\"\"}],\"carouselSlides\":[{\"slide\":\"1\",\"headline\":\"\",\"visual\":\"\",\"copy\":\"\"}],\"storyFrames\":[{\"frame\":\"1\",\"visual\":\"\",\"text\":\"\",\"stickerOrCta\":\"\"}],\"visualDirection\":\"\",\"shotList\":[\"\"],\"publishChecklist\":[\"\"],\"postPublishChecklist\":[\"\"]}}]}",
    "Exactly 7 items. Keep every field practical, specific, and in Indonesian. Do not invent metrics not present in the input.",
    "For non-matching fields, return an empty array rather than irrelevant content. Example: carouselSlides can be empty for Reels.",
    "Prefer GMT/brand-relevant ideas over generic social media advice.",
    JSON.stringify({
      account: {
        username: profile?.username,
        name: profile?.name,
        biography: profile?.biography,
        followers: profile?.followers_count,
        website: profile?.website,
      },
      dateRange,
      audience: {
        topOnlineFollowers: audience?.onlineFollowers?.slice(0, 4),
        demographics: {
          age: audience?.demographics?.age?.slice(0, 3),
          gender: audience?.demographics?.gender?.slice(0, 3),
          city: audience?.demographics?.city?.slice(0, 3),
          country: audience?.demographics?.country?.slice(0, 3),
        },
      },
      recentPosts: mediaPayload,
    }),
  ].join("\n");

  const { parsed, source } = await callAiJson({ prompt, temperature: 0.45, maxTokens: 8192 });
  if (source === "local") return { contentBrief: null, warning: null };

  const items = Array.isArray(parsed?.items) ? parsed.items.slice(0, 7) : [];

  if (items.length !== 7) {
    throw new Error("Alibaba Model Studio returned an invalid 7-day content brief payload.");
  }

  const cleanStringArray = (value) =>
    Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 12) : [];
  const cleanObjectArray = (value, shape) =>
    Array.isArray(value)
      ? value.slice(0, 12).map((item) => Object.fromEntries(
        Object.keys(shape).map((key) => [key, typeof item?.[key] === "string" ? item[key] : ""]),
      ))
      : [];
  const normalizeAssistantPackage = (assistant = {}) => ({
    formatType: typeof assistant.formatType === "string" ? assistant.formatType : "",
    caption: {
      hook: typeof assistant.caption?.hook === "string" ? assistant.caption.hook : "",
      body: typeof assistant.caption?.body === "string" ? assistant.caption.body : "",
      cta: typeof assistant.caption?.cta === "string" ? assistant.caption.cta : "",
      hashtags: cleanStringArray(assistant.caption?.hashtags),
    },
    script: cleanObjectArray(assistant.script, {
      timecode: "",
      visual: "",
      voiceOver: "",
      onScreenText: "",
    }),
    carouselSlides: cleanObjectArray(assistant.carouselSlides, {
      slide: "",
      headline: "",
      visual: "",
      copy: "",
    }),
    storyFrames: cleanObjectArray(assistant.storyFrames, {
      frame: "",
      visual: "",
      text: "",
      stickerOrCta: "",
    }),
    visualDirection: typeof assistant.visualDirection === "string" ? assistant.visualDirection : "",
    shotList: cleanStringArray(assistant.shotList),
    publishChecklist: cleanStringArray(assistant.publishChecklist),
    postPublishChecklist: cleanStringArray(assistant.postPublishChecklist),
  });

  return {
    contentBrief: {
      source,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      items: items.map((item, index) => ({
        day: typeof item.day === "string" ? item.day : `Hari ${index + 1}`,
        format: typeof item.format === "string" ? item.format : "Feed",
        pillar: typeof item.pillar === "string" ? item.pillar : "",
        objective: typeof item.objective === "string" ? item.objective : "",
        idea: typeof item.idea === "string" ? item.idea : "",
        formatGuide: typeof item.formatGuide === "string" ? item.formatGuide : "",
        action: typeof item.action === "string" ? item.action : "",
        reason: typeof item.reason === "string" ? item.reason : "",
        impact: typeof item.impact === "string" ? item.impact : "",
        assistant: normalizeAssistantPackage(item.assistant),
      })),
    },
    warning: null,
  };
};

const getContentBrief = async ({ profile, dateRange, mediaItems, audience }) => {
  try {
    return await callAlibabaForContentBrief({
      profile,
      dateRange,
      mediaPayload: getMediaReasoningPayload(mediaItems),
      audience,
    });
  } catch (error) {
    return {
      contentBrief: null,
      warning: `Alibaba content brief fallback: ${error.message}`,
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
    const mediaWithReasoning = await enrichMediaReasoning({
      mediaItems: media.data || [],
      profile,
      dateRange,
    });
    const contentBrief = await getContentBrief({
      profile,
      dateRange,
      mediaItems: mediaWithReasoning.data || [],
      audience: audience.data,
    });
    const contentReferences = await getReferenceInsights({
      profile,
      igUserId,
      recentPosts: getMediaReasoningPayload(mediaWithReasoning.data || []),
    });

    json(response, 200, {
      connected: true,
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
    });
  } catch (error) {
    json(response, 500, { connected: false, error: error.message || "Instagram insights request failed." });
  }
}
