import { json } from "../../meta/_meta-client.js";
import { authenticate, authorizeAgentOrUser } from "../../onboarding/_auth-helper.js";
import { readVideos, readProgress, writeProgress } from "../../onboarding/_store.js";

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
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
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

  const userId = String(user.id);
  const videos = await readVideos();
  const sortedVideos = [...videos].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const requiredVideos = sortedVideos.filter((v) => v.is_required);
  
  const progressDb = await readProgress();
  const userProgress = progressDb[userId] || [];

  // Helper to calculate progress summary
  const getSummary = () => {
    const completedRequired = requiredVideos.filter((v) => {
      const p = userProgress.find((entry) => Number(entry.video_id) === Number(v.id));
      return p && p.status === "completed";
    }).length;

    const totalRequired = requiredVideos.length;
    const completionPercent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;
    const isCompleted = totalRequired > 0 ? (completedRequired >= totalRequired) : true;

    return {
      completed_count: completedRequired,
      total_required: totalRequired,
      completion_percent: completionPercent,
      is_completed: isCompleted,
      progress: userProgress,
    };
  };

  // 2. Handle GET
  if (request.method === "GET") {
    return json(response, 200, getSummary());
  }

  // 3. Handle POST (Save Progress)
  if (request.method === "POST") {
    const body = await parseBody(request);
    const { video_id, watched_seconds, duration_seconds, status } = body;

    const targetVideoId = Number(video_id);
    const video = sortedVideos.find((v) => Number(v.id) === targetVideoId);
    if (!video) {
      return json(response, 404, { message: "video not found" });
    }

    // Determine status
    let finalStatus = status;
    const duration = Number(duration_seconds || video.duration_seconds || 1);
    const watched = Number(watched_seconds || 0);
    
    if (watched >= duration * 0.9) {
      finalStatus = "completed";
    }

    // Check sequence: Cannot play/complete video N if N-1 is not complete
    const videoIndex = sortedVideos.findIndex((v) => Number(v.id) === targetVideoId);
    if (videoIndex > 0) {
      const prevVideo = sortedVideos[videoIndex - 1];
      const prevProgress = userProgress.find((entry) => Number(entry.video_id) === Number(prevVideo.id));
      if (!prevProgress || prevProgress.status !== "completed") {
        return json(response, 400, { message: "Selesaikan video sebelumnya terlebih dahulu." });
      }
    }

    // Check if already completed
    const existingIndex = userProgress.findIndex((entry) => Number(entry.video_id) === targetVideoId);
    let currentRecord = existingIndex !== -1 ? userProgress[existingIndex] : null;

    if (currentRecord && currentRecord.status === "completed") {
      // Keep it completed, just update watched seconds if needed
      currentRecord.watched_seconds = Math.max(currentRecord.watched_seconds || 0, watched);
    } else {
      const newRecord = {
        video_id: targetVideoId,
        slug: video.slug,
        status: finalStatus === "completed" ? "completed" : "in_progress",
        watched_seconds: watched,
        completed_at: finalStatus === "completed" ? new Date().toISOString() : null,
      };

      if (existingIndex !== -1) {
        userProgress[existingIndex] = newRecord;
      } else {
        userProgress.push(newRecord);
      }
    }

    progressDb[userId] = userProgress;
    await writeProgress(progressDb);

    return json(response, 200, getSummary());
  }

  // 4. Handle DELETE (Reset Progress)
  if (request.method === "DELETE") {
    progressDb[userId] = [];
    await writeProgress(progressDb);

    return json(response, 200, { message: "onboarding progress reset success" });
  }

  return json(response, 451, { message: "Method not allowed" });
}
