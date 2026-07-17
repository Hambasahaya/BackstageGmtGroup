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

    const { message, client_key, task, ig_user_id, session_id } = body;
    if (!message) {
      json(response, 400, { error: "message is required" });
      return;
    }

    const authHeader = request.headers.authorization || request.headers.Authorization;
    const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/meta/role-chatbot`;

    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ message, client_key, task, ig_user_id, session_id }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      let errorPayload;
      try { errorPayload = errorText ? JSON.parse(errorText) : {}; }
      catch { errorPayload = { error: { message: errorText } }; }
      const errorMsg = errorPayload.error?.message || errorPayload.message || errorPayload.error || `Backend returned status ${backendResponse.status}`;
      json(response, backendResponse.status, { success: false, error: errorMsg });
      return;
    }

    // Support both streaming and JSON responses from backend
    const contentType = backendResponse.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
      response.statusCode = backendResponse.status;
      for (const [key, value] of backendResponse.headers.entries()) {
        if (key.toLowerCase() !== "content-length") {
          response.setHeader(key, value);
        }
      }
      response.setHeader("Cache-Control", "no-cache, no-transform");
      response.setHeader("Connection", "keep-alive");
      response.setHeader("X-Accel-Buffering", "no");

      if (typeof backendResponse.body.getReader === "function") {
        const reader = backendResponse.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          response.write(value);
        }
      } else {
        for await (const chunk of backendResponse.body) {
          response.write(chunk);
        }
      }
      response.end();
    } else {
      const result = await backendResponse.json();
      json(response, 200, result);
    }
  } catch (error) {
    json(response, 500, { success: false, error: error.message || "Role chatbot request failed." });
  }
}
