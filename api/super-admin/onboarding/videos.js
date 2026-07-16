import { json } from "../../meta/_meta-client.js";
import { authenticate, authorizeSuperAdmin } from "../../onboarding/_auth-helper.js";
import { readVideos, writeVideos, deleteVideoAndProgress } from "../../onboarding/_store.js";

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function parseBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }
  return new Promise((resolve) => {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    request.on("error", () => resolve({}));
  });
}

export default async function handler(request, response) {
  // CORS Headers
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  // 1. Authenticate & Authorize
  const user = await authenticate(request, response);
  if (!user) return; // Error response already handled by helper

  const isAuthorized = authorizeSuperAdmin(user, response);
  if (!isAuthorized) return; // Error response already handled by helper

  // 2. Parse URL and ID
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const idStr = requestUrl.searchParams.get("id");
  const id = idStr ? Number(idStr) : null;

  const videos = await readVideos();

  // 3. Handle Methods
  if (request.method === "GET") {
    if (id !== null) {
      // Detail Video
      const video = videos.find((v) => Number(v.id) === id);
      if (!video) {
        return json(response, 404, { message: "video not found" });
      }
      return json(response, 200, { video });
    } else {
      // List Videos
      return json(response, 200, { videos });
    }
  }

  if (request.method === "POST") {
    const body = await parseBody(request);
    const { title, description, video_url, duration_seconds, sort_order, is_required, slug } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return json(response, 400, { message: "title is required" });
    }
    if (title.length > 255) {
      return json(response, 400, { message: "title must be less than 255 characters" });
    }
    if (!video_url || !isValidUrl(video_url)) {
      return json(response, 400, { message: "valid video_url is required" });
    }
    if (duration_seconds === undefined || duration_seconds === null || Number(duration_seconds) < 1) {
      return json(response, 400, { message: "duration_seconds must be at least 1" });
    }

    const finalSlug = slug && slug.trim().length > 0 ? generateSlug(slug) : generateSlug(title);
    if (finalSlug.length > 100) {
      return json(response, 400, { message: "slug must be less than 100 characters" });
    }

    // Check slug duplicate
    const slugExists = videos.some((v) => v.slug === finalSlug);
    if (slugExists) {
      return json(response, 400, { message: "video slug already exists" });
    }

    const newId = videos.length > 0 ? Math.max(...videos.map((v) => Number(v.id))) + 1 : 1;
    const newVideo = {
      id: newId,
      slug: finalSlug,
      title: title.trim(),
      description: description ? description.trim() : "",
      video_url: video_url.trim(),
      duration_seconds: Number(duration_seconds),
      sort_order: sort_order !== undefined && sort_order !== null ? Number(sort_order) : 0,
      is_required: is_required !== undefined && is_required !== null ? Boolean(is_required) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    videos.push(newVideo);
    await writeVideos(videos);

    return json(response, 201, {
      message: "video created",
      video: newVideo,
    });
  }

  if (request.method === "PUT") {
    if (id === null) {
      return json(response, 400, { message: "video ID is required for update" });
    }

    const index = videos.findIndex((v) => Number(v.id) === id);
    if (index === -1) {
      return json(response, 404, { message: "video not found" });
    }

    const body = await parseBody(request);
    const { title, description, video_url, duration_seconds, sort_order, is_required, slug } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return json(response, 400, { message: "title is required" });
    }
    if (title.length > 255) {
      return json(response, 400, { message: "title must be less than 255 characters" });
    }
    if (!video_url || !isValidUrl(video_url)) {
      return json(response, 400, { message: "valid video_url is required" });
    }
    if (duration_seconds === undefined || duration_seconds === null || Number(duration_seconds) < 1) {
      return json(response, 400, { message: "duration_seconds must be at least 1" });
    }

    const finalSlug = slug && slug.trim().length > 0 ? generateSlug(slug) : generateSlug(title);
    if (finalSlug.length > 100) {
      return json(response, 400, { message: "slug must be less than 100 characters" });
    }

    // Check slug duplicate (excluding current video)
    const slugExists = videos.some((v) => v.slug === finalSlug && Number(v.id) !== id);
    if (slugExists) {
      return json(response, 400, { message: "video slug already exists" });
    }

    const updatedVideo = {
      ...videos[index],
      slug: finalSlug,
      title: title.trim(),
      description: description ? description.trim() : "",
      video_url: video_url.trim(),
      duration_seconds: Number(duration_seconds),
      sort_order: sort_order !== undefined && sort_order !== null ? Number(sort_order) : 0,
      is_required: is_required !== undefined && is_required !== null ? Boolean(is_required) : true,
      updated_at: new Date().toISOString(),
    };

    videos[index] = updatedVideo;
    await writeVideos(videos);

    return json(response, 200, {
      message: "video updated",
      video: updatedVideo,
    });
  }

  if (request.method === "DELETE") {
    if (id === null) {
      return json(response, 400, { message: "video ID is required for deletion" });
    }

    const exists = videos.some((v) => Number(v.id) === id);
    if (!exists) {
      return json(response, 404, { message: "video not found" });
    }

    await deleteVideoAndProgress(id);

    return json(response, 200, {
      message: "video deleted",
    });
  }

  return json(response, 451, { message: "Method not allowed" });
}
