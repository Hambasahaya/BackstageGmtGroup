import { createServer } from "node:http";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const apiDir = path.join(__dirname, "api");
const port = Number(process.env.PORT || 3000);

const redirects = new Map([
  ["/login", "https://gmtgroup.co.id/gmt-suite-auth?mode=login"],
  ["/register", "https://gmtgroup.co.id/gmt-suite-auth?mode=login"],
  ["/forgot-password", "https://gmtgroup.co.id/gmt-suite-auth?mode=login"],
  ["/reset-password", "https://gmtgroup.co.id/gmt-suite-auth?mode=login"],
]);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function sanitizeStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const fullPath = path.resolve(distDir, relativePath);
  return fullPath.startsWith(distDir) ? fullPath : null;
}

async function serveFile(request, response, filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return false;

    const extension = path.extname(filePath).toLowerCase();
    response.statusCode = 200;
    response.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
    response.setHeader("Content-Length", stat.size);

    if (request.method === "HEAD") {
      response.end();
      return true;
    }

    createReadStream(filePath).pipe(response);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function resolveApiHandler(pathname) {
  if (pathname.startsWith("/api/meta/")) {
    return path.join(apiDir, "meta", "index.js");
  }

  if (pathname === "/api/super-admin/onboarding/videos" || pathname.startsWith("/api/super-admin/onboarding/videos/")) {
    return path.join(apiDir, "super-admin", "onboarding", "videos.js");
  }

  if (pathname === "/api/agent/onboarding/videos") {
    return path.join(apiDir, "agent", "onboarding", "videos.js");
  }

  if (pathname === "/api/agent/onboarding/progress") {
    return path.join(apiDir, "agent", "onboarding", "progress.js");
  }

  const relativeApiPath = `${pathname.replace(/^\/api\/?/, "")}.js`;
  const handlerPath = path.resolve(apiDir, relativeApiPath);
  return handlerPath.startsWith(apiDir) ? handlerPath : null;
}

function applyVercelStyleApiRewrite(request, pathname) {
  if (pathname.startsWith("/api/super-admin/onboarding/videos/")) {
    const id = pathname.split("/").pop();
    const rewritten = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    rewritten.pathname = "/api/super-admin/onboarding/videos";
    rewritten.searchParams.set("id", id);
    request.url = `${rewritten.pathname}${rewritten.search}`;
  }
}

async function handleApiRequest(request, response, pathname) {
  const handlerPath = await resolveApiHandler(pathname);
  if (!handlerPath) {
    sendJson(response, 404, { error: `Not found: ${pathname}` });
    return;
  }

  try {
    await fs.access(handlerPath);
    applyVercelStyleApiRewrite(request, pathname);
    const module = await import(pathToFileURL(handlerPath).href);
    const handler = module.default;

    if (typeof handler !== "function") {
      sendJson(response, 500, { error: `API handler has no default export: ${pathname}` });
      return;
    }

    await handler(request, response);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: `Not found: ${pathname}` });
      return;
    }

    console.error("API handler error:", error);
    sendJson(response, 500, { error: "Internal server error" });
  }
}

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const pathname = requestUrl.pathname.replace(/\/$/, "") || "/";

    if (redirects.has(pathname)) {
      response.statusCode = 302;
      response.setHeader("Location", redirects.get(pathname));
      response.end();
      return;
    }

    if (pathname.startsWith("/api/")) {
      await handleApiRequest(request, response, pathname);
      return;
    }

    const staticPath = sanitizeStaticPath(requestUrl.pathname);
    if (staticPath && await serveFile(request, response, staticPath)) return;

    await serveFile(request, response, path.join(distDir, "index.html"));
  } catch (error) {
    console.error("Server error:", error);
    sendJson(response, 500, { error: "Internal server error" });
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`GMT Group dashboard listening on port ${port}`);
});
