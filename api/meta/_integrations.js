import { authenticate } from "../onboarding/_auth-helper.js";
import { json } from "./_meta-client.js";

const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  // 1. Authenticate the request using JWT
  const user = await authenticate(request, response);
  if (!user) return; // Error already handled by authenticate helper

  if (request.method !== "POST" && request.method !== "DELETE") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const authHeader = request.headers.authorization || request.headers.Authorization;
    const fetchHeaders = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      fetchHeaders["Authorization"] = authHeader;
    }

    const fetchOptions = {
      method: request.method,
      headers: fetchHeaders,
    };

    if (request.method === "POST") {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
      fetchOptions.body = JSON.stringify(body);
    }

    const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/integrations`;
    const backendResponse = await fetch(targetUrl, fetchOptions);
    const backendData = await backendResponse.json().catch(() => ({}));

    json(response, backendResponse.status, backendData);
  } catch (error) {
    json(response, 500, { success: false, error: error.message || "Failed to process integrations on backend." });
  }
}
