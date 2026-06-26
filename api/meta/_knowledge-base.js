import { json } from "./_meta-client.js";
import { readKnowledgeBaseStore, writeKnowledgeBaseStore } from "./_knowledge-base-store.js";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === "GET") {
    try {
      const payload = await readKnowledgeBaseStore();
      json(response, 200, { success: true, data: payload });
    } catch (error) {
      json(response, 500, { error: error.message || "Failed to read knowledge base." });
    }
    return;
  }

  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const payload = body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const saved = await writeKnowledgeBaseStore(payload);
    json(response, 200, { success: true, data: saved });
  } catch (error) {
    json(response, 500, { error: error.message || "Failed to save knowledge base." });
  }
}
