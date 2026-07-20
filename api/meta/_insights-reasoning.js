import "./_load-env.js";
import { json } from "./_meta-client.js";

const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST" && request.method !== "GET") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const authHeader = request.headers.authorization || request.headers.Authorization;
    let targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/insights/reasoning`;
    let fetchOptions = {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    };

    if (request.method === "GET") {
      // Forward query parameters
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.search) {
        targetUrl += url.search;
      }
      delete fetchOptions.headers["Content-Type"];
    } else {
      // Handle POST body
      const body = await new Promise((resolve, reject) => {
        let raw = "";
        request.on("data", (chunk) => { raw += chunk; });
        request.on("end", () => {
          try { resolve(raw ? JSON.parse(raw) : {}); }
          catch (error) { reject(error); }
        });
        request.on("error", reject);
      });

      const { account, dateRange, posts } = body;
      if (!posts || !Array.isArray(posts)) {
        json(response, 400, { error: "Missing or invalid posts array" });
        return;
      }
      fetchOptions.body = JSON.stringify({ account, dateRange, posts });
    }

    const backendResponse = await fetch(targetUrl, fetchOptions);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(errorText || `Backend returned status ${backendResponse.status}`);
    }

    const result = await backendResponse.json();
    json(response, 200, result);
  } catch (error) {
    json(response, 500, { error: error.message || "Insights reasoning request failed." });
  }
}
