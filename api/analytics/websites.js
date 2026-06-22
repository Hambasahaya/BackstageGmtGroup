import { readFileSync } from "node:fs";
import { sign } from "node:crypto";

const json = (response, statusCode, body) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
};

const base64Url = (value) => Buffer.from(value).toString("base64url");

const readServiceAccount = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8"));
  }
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GA4_SERVICE_ACCOUNT_FILE;
  return credentialPath ? JSON.parse(readFileSync(credentialPath, "utf8")) : null;
};

const getServiceAccountToken = async (credential) => {
  if (!credential.client_email || !credential.private_key) {
    throw new Error("Service account JSON must contain client_email and private_key.");
  }
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = credential.token_uri || "https://oauth2.googleapis.com/token";
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: credential.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${claims}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsignedToken), credential.private_key).toString("base64url");
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedToken}.${signature}`,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description || payload.error || "Service account token request failed.");
  return payload.access_token;
};

const getGoogleAccessToken = async () => {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;

  const serviceAccount = readServiceAccount();
  if (serviceAccount) return getServiceAccountToken(serviceAccount);

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN for GA4 access.");
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
  if (!response.ok) throw new Error(payload.error_description || payload.error || "Google token request failed.");
  return payload.access_token;
};

const getProperties = async (accessToken) => {
  if (process.env.GA4_PROPERTIES) {
    let properties;
    try {
      properties = JSON.parse(process.env.GA4_PROPERTIES);
    } catch {
      throw new Error("GA4_PROPERTIES must be valid JSON.");
    }
    if (!Array.isArray(properties)) throw new Error("GA4_PROPERTIES must be a JSON array.");
    return properties.map((property) => ({
      id: String(property.id || "").replace(/^properties\//, ""),
      name: String(property.name || property.domain || property.id || "GA4 Property"),
      domain: String(property.domain || property.name || property.id || ""),
      gscSiteUrl: String(property.gscSiteUrl || property.searchConsoleSiteUrl || ""),
    })).filter((property) => property.id);
  }

  const configuredProperties = String(process.env.GA4_PROPERTY_IDS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, domain] = entry.split(":").map((value) => value.trim());
      return { id: id.replace(/^properties\//, ""), name: domain || id, domain: domain || id, gscSiteUrl: process.env.GSC_SITE_URL || "" };
    });

  if (configuredProperties.length) return configuredProperties;

  const response = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json();
  if (!response.ok) {
    const detail = payload.error?.message || "Could not discover GA4 properties.";
    throw new Error(`GA4 property auto-discovery failed. Enable Google Analytics Admin API or set GA4_PROPERTIES/GA4_PROPERTY_IDS. ${detail}`);
  }

  return (payload.accountSummaries || []).flatMap((account) => (account.propertySummaries || []).map((property) => ({
    id: String(property.property || "").replace(/^properties\//, ""),
    name: property.displayName || property.property,
    domain: property.displayName || property.property,
    gscSiteUrl: process.env.GSC_SITE_URL || "",
  }))).filter((property) => property.id);
};

const numberValue = (row, index) => Number(row?.metricValues?.[index]?.value || 0);
const dimensionValue = (row, index) => row?.dimensionValues?.[index]?.value || "";

const fetchKeywordPerformance = async ({ property, accessToken, startDate, endDate }) => {
  if (!property.gscSiteUrl) return [];

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property.gscSiteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query", "page"],
        rowLimit: 50,
        type: "web",
        orderBy: [{ fieldName: "position", sortOrder: "ascending" }],
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(`${property.domain} Search Console: ${payload.error?.message || "keyword report failed."}`);

  return (payload.rows || []).map((row) => ({
    keyword: row.keys?.[0] || "(not set)",
    page: row.keys?.[1] || "",
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number(row.ctr || 0),
    position: Number(row.position || 0),
  }));
};

const fetchProperty = async ({ property, accessToken, startDate, endDate }) => {
  const [ga4Result, keywordResult] = await Promise.allSettled([
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property.id}:batchRunReports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          dateRanges: [{ startDate, endDate }],
          metrics: ["sessions", "totalUsers", "newUsers", "screenPageViews", "bounceRate", "engagementRate", "averageSessionDuration", "screenPageViewsPerSession"].map((name) => ({ name })),
        },
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "date" }],
          metrics: ["sessions", "totalUsers", "screenPageViews"].map((name) => ({ name })),
          orderBys: [{ dimension: { dimensionName: "date" } }],
          limit: "100",
        },
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }, { name: "sessionSourceMedium" }],
          metrics: ["sessions", "totalUsers", "engagedSessions"].map((name) => ({ name })),
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: "50",
        },
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: ["screenPageViews", "totalUsers", "engagementRate", "averageSessionDuration"].map((name) => ({ name })),
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: "50",
        },
        {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "newVsReturning" }],
          metrics: ["totalUsers", "sessions"].map((name) => ({ name })),
        },
      ],
    }),
  }),
    fetchKeywordPerformance({ property, accessToken, startDate, endDate }),
  ]);

  if (ga4Result.status === "rejected") throw ga4Result.reason;
  const response = ga4Result.value;
  const payload = await response.json();
  if (!response.ok) throw new Error(`${property.domain}: ${payload.error?.message || "GA4 report failed."}`);

  const [overview, daily, sources, pages, visitorTypes] = payload.reports || [];
  const totalsRow = overview?.rows?.[0];
  return {
    ...property,
    totals: {
      sessions: numberValue(totalsRow, 0), users: numberValue(totalsRow, 1), newUsers: numberValue(totalsRow, 2), pageviews: numberValue(totalsRow, 3),
      bounceRate: numberValue(totalsRow, 4), engagementRate: numberValue(totalsRow, 5), averageSessionDuration: numberValue(totalsRow, 6), pagesPerSession: numberValue(totalsRow, 7),
    },
    daily: (daily?.rows || []).map((row) => ({ date: dimensionValue(row, 0), sessions: numberValue(row, 0), users: numberValue(row, 1), pageviews: numberValue(row, 2) })),
    sources: (sources?.rows || []).map((row) => ({ channel: dimensionValue(row, 0), sourceMedium: dimensionValue(row, 1), sessions: numberValue(row, 0), users: numberValue(row, 1), engagedSessions: numberValue(row, 2) })),
    pages: (pages?.rows || []).map((row) => ({ path: dimensionValue(row, 0), title: dimensionValue(row, 1), pageviews: numberValue(row, 0), users: numberValue(row, 1), engagementRate: numberValue(row, 2), averageSessionDuration: numberValue(row, 3) })),
    visitorTypes: (visitorTypes?.rows || []).map((row) => ({ type: dimensionValue(row, 0), users: numberValue(row, 0), sessions: numberValue(row, 1) })),
    keywordPerformance: keywordResult.status === "fulfilled" ? keywordResult.value : [],
    keywordWarning: keywordResult.status === "rejected" ? keywordResult.reason?.message || "Search Console keyword report failed." : "",
  };
};

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") { response.statusCode = 204; response.end(); return; }
  if (request.method !== "GET") { json(response, 405, { error: "Method not allowed" }); return; }

  try {
    const accessToken = await getGoogleAccessToken();
    const properties = await getProperties(accessToken);
    if (!properties.length) throw new Error("Set GA4_PROPERTIES or GA4_PROPERTY_IDS with at least one GA4 property.");
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const days = Math.max(1, Math.min(Number(requestUrl.searchParams.get("days") || process.env.GA4_REPORT_DAYS || 30), 365));
    const endDate = new Date().toISOString().slice(0, 10);
    const start = new Date(); start.setDate(start.getDate() - days + 1);
    const startDate = start.toISOString().slice(0, 10);
    const results = await Promise.allSettled(properties.map((property) => fetchProperty({ property, accessToken, startDate, endDate })));
    const loaded = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
    const warnings = [
      ...results.filter((result) => result.status === "rejected").map((result) => result.reason?.message || "Property failed."),
      ...loaded.map((property) => property.keywordWarning).filter(Boolean),
    ];
    if (!loaded.length) throw new Error(warnings.join(" | ") || "No GA4 property could be loaded.");
    json(response, 200, { startDate, endDate, properties: loaded, warnings });
  } catch (error) {
    json(response, 500, { error: error.message || "Website analytics request failed." });
  }
}
