import url from "node:url";

const json = (res, status, data) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

export default async function handler(request, response) {
  // CORS Headers
  response.setHeader("Access-Control-Allow-Origin", "*");
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
      request.on("data", (chunk) => {
        raw += chunk;
      });
      request.on("end", () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(error);
        }
      });
      request.on("error", reject);
    });

    const { message } = body;

    if (!message) {
      json(response, 400, { error: "Message is required" });
      return;
    }

    const authHeader = request.headers.authorization || request.headers.Authorization;
    const fetchHeaders = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      fetchHeaders["Authorization"] = authHeader;
    }

    const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";
    const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/chatbot`;

    const aiResponse = await fetch(targetUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(body),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { error: { message: text } };
      }
      const errorMsg = payload.error?.message || payload.message || "Failed to call backend chatbot API.";
      json(response, aiResponse.status, { error: errorMsg });
      return;
    }

    // Forward status and headers
    response.statusCode = aiResponse.status;
    for (const [key, value] of aiResponse.headers.entries()) {
      if (key.toLowerCase() !== "content-length") {
        response.setHeader(key, value);
      }
    }

    // Set standard streaming headers just in case
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");

    if (typeof aiResponse.body.getReader === "function") {
      const reader = aiResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        response.write(value);
      }
    } else {
      for await (const chunk of aiResponse.body) {
        response.write(chunk);
      }
    }
    response.end();
  } catch (error) {
    console.error("Chatbot API error:", error);
    json(response, 500, { error: error.message || "Internal server error" });
  }
}
