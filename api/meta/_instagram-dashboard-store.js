import "./_load-env.js";
import { json } from "./_meta-client.js";

const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Read the raw request body as a stream and parse it as JSON.
 * request.body is NOT automatically populated in plain Node.js HTTP handlers —
 * it must be consumed from the readable stream.
 */
const readBody = (request) =>
  new Promise((resolve, reject) => {
    if (request.body !== undefined) {
      try {
        resolve(typeof request.body === "string" ? JSON.parse(request.body) : request.body || {});
      } catch (err) {
        reject(err);
      }
      return;
    }
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (err) { reject(err); }
    });
    request.on("error", reject);
  });

/**
 * Normalize body into an array of account payloads.
 * Supports:
 *   - Single account: { ig_user_id, ig_username, since, until, ... }
 *   - Bulk accounts:  { accounts: [ { ig_user_id, ... }, ... ] }
 */
const normalizeAccounts = (body) => {
  if (Array.isArray(body?.accounts) && body.accounts.length > 0) {
    return body.accounts;
  }
  if (body?.ig_user_id) {
    return [body];
  }
  return [];
};

/**
 * Send one account payload to the backend store endpoint.
 * Returns a result object with status, snapshot_id, stored_at, or error.
 */
const storeOneAccount = async (accountPayload, fetchHeaders) => {
  const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/instagram-dashboard/store`;
  const igUserId = accountPayload.ig_user_id;
  const since = accountPayload.since;
  const until = accountPayload.until;

  try {
    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(accountPayload),
    });

    const backendData = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      const errorMsg = backendData?.message || backendData?.error || `HTTP ${backendResponse.status}`;
      return {
        ig_user_id: igUserId,
        since,
        until,
        status: "failed",
        error: errorMsg,
        stored_at: new Date().toISOString(),
      };
    }

    // Backend may return snapshot_id, id, or similar identifier
    const snapshotId = backendData?.snapshot_id ?? backendData?.id ?? backendData?.data?.id ?? null;

    return {
      ig_user_id: igUserId,
      since,
      until,
      status: "stored",
      snapshot_id: snapshotId,
      stored_at: backendData?.stored_at || backendData?.created_at || new Date().toISOString(),
    };
  } catch (err) {
    return {
      ig_user_id: igUserId,
      since,
      until,
      status: "failed",
      error: err.message || "Network error",
      stored_at: new Date().toISOString(),
    };
  }
};

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

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
    const accounts = normalizeAccounts(body);

    if (accounts.length === 0) {
      json(response, 400, {
        success: false,
        message: "Request body must contain ig_user_id (single) or accounts[] (bulk)",
      });
      return;
    }

    const authHeader = request.headers.authorization || request.headers.Authorization;
    const fetchHeaders = { "Content-Type": "application/json" };
    if (authHeader) fetchHeaders["Authorization"] = authHeader;

    // Store all accounts concurrently (backend handles each individually)
    const results = await Promise.all(
      accounts.map((account) => storeOneAccount(account, fetchHeaders))
    );

    const storedCount = results.filter((r) => r.status === "stored").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    json(response, 200, {
      success: true,
      message: accounts.length === 1
        ? "Instagram dashboard data stored"
        : `Instagram dashboard data stored for ${storedCount} of ${accounts.length} accounts`,
      total: accounts.length,
      stored_count: storedCount,
      failed_count: failedCount,
      data: results,
    });
  } catch (error) {
    json(response, 500, {
      success: false,
      message: error.message || "Failed to store instagram dashboard data",
      total: 0,
      stored_count: 0,
      failed_count: 0,
      data: [],
    });
  }
}
