const ADS_API_VERSION = "v22";

const json = (response, statusCode, body) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
};

const readBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const getGoogleAccessToken = async () => {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
    return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const tokenPayload = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || "Google OAuth token request failed.");
  }

  return tokenPayload.access_token;
};

const microsToCurrency = (value) => {
  if (!value) {
    return null;
  }

  return Math.round(Number(value) / 10000) / 100;
};

const getTrend = (monthlySearchVolumes = []) => {
  if (monthlySearchVolumes.length < 2) {
    return null;
  }

  const sorted = [...monthlySearchVolumes].sort((a, b) => {
    const yearDiff = Number(a.year || 0) - Number(b.year || 0);
    return yearDiff || Number(a.month || 0) - Number(b.month || 0);
  });
  const first = Number(sorted[0]?.monthlySearches || 0);
  const last = Number(sorted[sorted.length - 1]?.monthlySearches || 0);

  if (!first || !last) {
    return null;
  }

  return Math.round(((last - first) / first) * 100);
};

const fetchKeywordPlannerIdeas = async ({ accessToken, keywords }) => {
  const {
    GOOGLE_ADS_CUSTOMER_ID,
    GOOGLE_ADS_DEVELOPER_TOKEN,
    GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    GOOGLE_ADS_LANGUAGE_RESOURCE = "languageConstants/1044",
    GOOGLE_ADS_LOCATION_RESOURCE = "geoTargetConstants/2360",
  } = process.env;

  if (!GOOGLE_ADS_CUSTOMER_ID || !GOOGLE_ADS_DEVELOPER_TOKEN) {
    throw new Error("Missing Google Ads credentials. Set GOOGLE_ADS_CUSTOMER_ID and GOOGLE_ADS_DEVELOPER_TOKEN.");
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
  };

  if (GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers["login-customer-id"] = GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  }

  const adsResponse = await fetch(
    `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${GOOGLE_ADS_CUSTOMER_ID}:generateKeywordIdeas`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        language: GOOGLE_ADS_LANGUAGE_RESOURCE,
        geoTargetConstants: [GOOGLE_ADS_LOCATION_RESOURCE],
        includeAdultKeywords: false,
        keywordPlanNetwork: "GOOGLE_SEARCH_AND_PARTNERS",
        keywordSeed: { keywords },
        pageSize: 50,
      }),
    },
  );

  const adsPayload = await adsResponse.json();

  if (!adsResponse.ok) {
    throw new Error(adsPayload.error?.message || "Google Ads Keyword Planner request failed.");
  }

  return (adsPayload.results || []).map((item) => {
    const metrics = item.keywordIdeaMetrics || {};

    return {
      keyword: item.text,
      searchVolume: Number(metrics.avgMonthlySearches || 0),
      cpcLow: microsToCurrency(metrics.lowTopOfPageBidMicros),
      cpcHigh: microsToCurrency(metrics.highTopOfPageBidMicros),
      competition: metrics.competition || "UNSPECIFIED",
      competitionIndex: metrics.competitionIndex ?? null,
      relatedKeywords: item.closeVariants || [],
      monthlySearchVolumes: metrics.monthlySearchVolumes || [],
      trendPercent: getTrend(metrics.monthlySearchVolumes || []),
      source: "google_ads_keyword_planner",
    };
  });
};

const fetchGscRows = async ({ accessToken, siteUrl, keywords, startDate, endDate }) => {
  if (!siteUrl) {
    return [];
  }

  const gscRows = [];

  for (const keyword of keywords) {
    const gscResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: 25,
          type: "web",
          dimensionFilterGroups: [
            {
              groupType: "and",
              filters: [
                {
                  dimension: "query",
                  operator: "contains",
                  expression: keyword,
                },
              ],
            },
          ],
        }),
      },
    );

    const gscPayload = await gscResponse.json();

    if (!gscResponse.ok) {
      throw new Error(gscPayload.error?.message || "Google Search Console request failed.");
    }

    gscRows.push(
      ...(gscPayload.rows || []).map((row) => ({
        keyword: row.keys?.[0] || keyword,
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
        ctr: Number(row.ctr || 0),
        position: Number(row.position || 0),
        matchedSeed: keyword,
        source: "google_search_console",
      })),
    );
  }

  return gscRows;
};

const mergeKeywordData = ({ adsIdeas, gscRows, requestedKeywords }) => {
  const gscByKeyword = new Map();

  for (const row of gscRows) {
    const key = row.keyword.toLowerCase();
    const current = gscByKeyword.get(key) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    current.ctr += row.ctr;
    current.position += row.position;
    current.count += 1;
    gscByKeyword.set(key, current);
  }

  const rows = adsIdeas.length
    ? adsIdeas
    : requestedKeywords.map((keyword) => ({
        keyword,
        searchVolume: null,
        cpcLow: null,
        cpcHigh: null,
        competition: null,
        competitionIndex: null,
        relatedKeywords: [],
        trendPercent: null,
        source: "google_search_console",
      }));

  return rows.map((row) => {
    const gsc = gscByKeyword.get(row.keyword.toLowerCase());

    return {
      ...row,
      gsc: gsc
        ? {
            clicks: gsc.clicks,
            impressions: gsc.impressions,
            ctr: gsc.ctr / gsc.count,
            position: gsc.position / gsc.count,
          }
        : null,
    };
  });
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
    const body = await readBody(request);
    const keywords = String(body.keywords || "")
      .split(/\r?\n|,/)
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    if (!keywords.length) {
      json(response, 400, { error: "At least one keyword is required." });
      return;
    }

    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() - 3);
    const start = new Date(end);
    start.setDate(end.getDate() - 28);

    const startDate = body.startDate || start.toISOString().slice(0, 10);
    const endDate = body.endDate || end.toISOString().slice(0, 10);
    const siteUrl = body.siteUrl || process.env.GSC_SITE_URL || "";
    const accessToken = await getGoogleAccessToken();
    const [adsIdeas, gscRows] = await Promise.all([
      fetchKeywordPlannerIdeas({ accessToken, keywords }),
      fetchGscRows({ accessToken, siteUrl, keywords, startDate, endDate }),
    ]);

    json(response, 200, {
      keywords: mergeKeywordData({ adsIdeas, gscRows, requestedKeywords: keywords }),
      gscRows,
      meta: {
        startDate,
        endDate,
        siteUrl,
        adsApiVersion: ADS_API_VERSION,
        sources: ["google_ads_keyword_planner", ...(siteUrl ? ["google_search_console"] : [])],
      },
    });
  } catch (error) {
    json(response, 500, { error: error.message || "Keyword research integration failed." });
  }
}
