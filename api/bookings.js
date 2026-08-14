import { json } from "./meta/_meta-client.js";
import { authenticate, authorizeAdminOrSalesOrMarketing } from "./onboarding/_auth-helper.js";
import { readBookings, updateBookingStatus } from "./_bookings-store.js";

const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";
const allowedStatuses = new Set(["approved", "rejected", "pending"]);

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (_error) {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }
}

function getRequestedStatus(action, body) {
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  return body?.status;
}

function isUpdateRequest(method, action) {
  if (action === "status") return ["PUT", "PATCH"].includes(method);
  if (["approve", "reject"].includes(action)) return ["PUT", "POST"].includes(method);
  return false;
}

async function forwardUpdateRequest(request, id, action, body, authHeader) {
  const targetUrl = new URL(`${apiBaseUrl.replace(/\/$/, "")}/api/bookings/${encodeURIComponent(id)}/${action}`);
  const res = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });

  if (!res.ok) return null;
  return { status: res.status, data: await res.json() };
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,PUT,PATCH,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const id = requestUrl.searchParams.get("id");
    const action = requestUrl.searchParams.get("action");

    if (!id && !action && request.method !== "GET") {
      return json(response, 405, {
        success: false,
        message: "invalid request",
        error: "Method not allowed",
      });
    }

    if ((id || action) && !isUpdateRequest(request.method, action)) {
      return json(response, 405, {
        success: false,
        message: "invalid request",
        error: "Method not allowed",
      });
    }


    const user = await authenticate(request, response);
    if (!user) return;

    const isAuthorized = authorizeAdminOrSalesOrMarketing(user, response);
    if (!isAuthorized) return;

    if (id && action) {
      const body = await readBody(request);
      const requestedStatus = getRequestedStatus(action, body);
      const normalizedStatus = String(requestedStatus || "").trim().toLowerCase();

      if (!allowedStatuses.has(normalizedStatus)) {
        return json(response, 400, {
          success: false,
          message: "invalid request",
          error: "Invalid booking status",
        });
      }

      const authHeader = request.headers.authorization || request.headers.Authorization;
      if (authHeader) {
        try {
          const forwarded = await forwardUpdateRequest(request, id, action, { ...body, status: normalizedStatus }, authHeader);
          if (forwarded) {
            return json(response, forwarded.status, forwarded.data);
          }
        } catch (_error) {
          // Fallback to local store if upstream API is unreachable
        }
      }

      const updatedBooking = await updateBookingStatus(id, normalizedStatus);
      return json(response, 200, {
        success: true,
        message: `Booking ${normalizedStatus}`,
        data: updatedBooking,
      });
    }

    if (request.method !== "GET") {
      return json(response, 405, {
        success: false,
        message: "invalid request",
        error: "Method not allowed",
      });
    }

    const typeParam = requestUrl.searchParams.get("type");

    if (typeParam && !["demo", "event"].includes(typeParam.toLowerCase())) {
      return json(response, 400, {
        success: false,
        message: "invalid request",
        error: `Invalid type parameter: '${typeParam}'. Allowed values are 'demo' or 'event'.`,
      });
    }

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
    return json(response, error.statusCode || 500, {
      success: false,
      message: "invalid request",
      error: error.message || "Internal server error",
    });
  }
}
