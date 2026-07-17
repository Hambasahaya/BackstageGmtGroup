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

  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
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

    const authHeader = request.headers.authorization || request.headers.Authorization;
    const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/insights/reasoning`;

    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ account, dateRange, posts }),
    });

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
