import { json } from "./meta/_meta-client.js";
import { authenticate, authorizeAdminOrSalesOrMarketing } from "./onboarding/_auth-helper.js";
import { readBookings } from "./_bookings-store.js";

const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";

export default async function handler(request, response) {
  // 1. Set CORS headers
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  // 2. Validate HTTP method
  if (request.method !== "GET") {
    return json(response, 405, {
      success: false,
      message: "invalid request",
      error: "Method not allowed",
    });
  }

  try {
    // 3. Authenticate & Authorize
    const user = await authenticate(request, response);
    if (!user) return; // 401 response already handled by helper

    const isAuthorized = authorizeAdminOrSalesOrMarketing(user, response);
    if (!isAuthorized) return; // 403 response already handled by helper

    // 4. Parse query parameters
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const typeParam = requestUrl.searchParams.get("type");

    if (typeParam && !["demo", "event"].includes(typeParam.toLowerCase())) {
      return json(response, 400, {
        success: false,
        message: "invalid request",
        error: `Invalid type parameter: '${typeParam}'. Allowed values are 'demo' or 'event'.`,
      });
    }

    // 5. Try forwarding request to upstream API backend if available
    const authHeader = request.headers.authorization || request.headers.Authorization;
    if (authHeader) {
      try {
        const targetUrl = new URL(`${apiBaseUrl.replace(/\/$/, "")}/api/bookings`);
        if (typeParam) {
          targetUrl.searchParams.set("type", typeParam.toLowerCase());
        }

        const res = await fetch(targetUrl.toString(), {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const remoteData = await res.json();
          return json(response, res.status, remoteData);
        }
      } catch (_error) {
        // Fallback to local store if upstream API is unreachable
      }
    }

    // 6. Local store fallback
    let bookings = await readBookings();

    if (typeParam) {
      const normalizedType = typeParam.toLowerCase();
      bookings = bookings.filter((b) => String(b.type).toLowerCase() === normalizedType);
    }

    return json(response, 200, {
      success: true,
      data: bookings,
    });
  } catch (error) {
    return json(response, 500, {
      success: false,
      message: "invalid request",
      error: error.message || "Internal server error",
    });
  }
}
