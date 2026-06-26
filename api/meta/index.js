import url from "node:url";
import accountsHandler from "./_accounts.js";
import authUrlHandler from "./_auth-url.js";
import autoPostHandler from "./_auto-post.js";
import callbackHandler from "./_callback.js";
import competitorBenchmarkHandler from "./_competitor-benchmark.js";
import generateContentHandler from "./_generate-content.js";
import instagramInsightsHandler from "./_instagram-insights.js";
import knowledgeBaseHandler from "./_knowledge-base.js";
import referenceBriefHandler from "./_reference-brief.js";

const handlers = {
  "/api/meta/accounts": accountsHandler,
  "/api/meta/auth-url": authUrlHandler,
  "/api/meta/auto-post": autoPostHandler,
  "/api/meta/callback": callbackHandler,
  "/api/meta/competitor-benchmark": competitorBenchmarkHandler,
  "/api/meta/generate-content": generateContentHandler,
  "/api/meta/instagram-insights": instagramInsightsHandler,
  "/api/meta/knowledge-base": knowledgeBaseHandler,
  "/api/meta/reference-brief": referenceBriefHandler,
};

export default async function handler(request, response) {
  // Extract only the pathname (excluding query parameters)
  const parsedUrl = url.parse(request.url, true);
  const pathname = parsedUrl.pathname.replace(/\/$/, "");

  const handlerFunc = handlers[pathname];
  if (handlerFunc) {
    return handlerFunc(request, response);
  }

  response.statusCode = 404;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ error: `Not found: ${pathname}` }));
}
