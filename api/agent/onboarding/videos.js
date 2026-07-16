import { json } from "../../meta/_meta-client.js";
import { authenticate, authorizeAgentOrUser } from "../../onboarding/_auth-helper.js";
import { readVideos } from "../../onboarding/_store.js";

export default async function handler(request, response) {
  // CORS Headers
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  // 1. Authenticate & Authorize
  const user = await authenticate(request, response);
  if (!user) return; // Error response already handled by helper

  const isAuthorized = authorizeAgentOrUser(user, response);
  if (!isAuthorized) return; // Error response already handled by helper

  if (request.method !== "GET") {
    return json(response, 451, { message: "Method not allowed" });
  }

  // 2. Fetch and Sort Videos
  const videos = await readVideos();
  const sortedVideos = [...videos].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return json(response, 200, { videos: sortedVideos });
}
