import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const VIDEOS_STORE_PATH =
  process.env.ONBOARDING_VIDEOS_STORE_PATH ||
  path.join(os.tmpdir(), "gmtgroupbe-onboarding-videos.json");

const PROGRESS_STORE_PATH =
  process.env.ONBOARDING_PROGRESS_STORE_PATH ||
  path.join(os.tmpdir(), "gmtgroupbe-onboarding-progress.json");

const defaultVideos = [
  {
    id: 1,
    slug: "agent-introduction",
    title: "Pengenalan Role Agent",
    description: "Materi dasar mengenai tugas, tanggung jawab, dan kode etik seorang agent.",
    video_url: "https://www.youtube.com/watch?v=4UPgUT-bMiU",
    duration_seconds: 380,
    sort_order: 1,
    is_required: true,
    created_at: "2026-07-16T10:00:00Z",
    updated_at: "2026-07-16T10:00:00Z"
  },
  {
    id: 2,
    slug: "agent-workflow",
    title: "Workflow Tugas Agent",
    description: "Panduan lengkap alur kerja harian agent dari awal hingga penyelesaian order.",
    video_url: "https://www.youtube.com/watch?v=IH7kHpxtTp4",
    duration_seconds: 420,
    sort_order: 2,
    is_required: true,
    created_at: "2026-07-16T10:00:00Z",
    updated_at: "2026-07-16T10:00:00Z"
  },
  {
    id: 3,
    slug: "agent-commission",
    title: "Sistem Komisi Agent",
    description: "Penjelasan rinci persentase dan tiering pembagian hasil komisi penjualan.",
    video_url: "https://www.youtube.com/watch?v=aNwhxCN2dyg",
    duration_seconds: 300,
    sort_order: 3,
    is_required: true,
    created_at: "2026-07-16T10:00:00Z",
    updated_at: "2026-07-16T10:00:00Z"
  }
];

export async function readVideos() {
  try {
    const raw = await fs.readFile(VIDEOS_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultVideos;
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeVideos(defaultVideos);
      return defaultVideos;
    }
    return defaultVideos;
  }
}

export async function writeVideos(videos) {
  const safeVideos = Array.isArray(videos) ? videos : [];
  await fs.mkdir(path.dirname(VIDEOS_STORE_PATH), { recursive: true });
  await fs.writeFile(VIDEOS_STORE_PATH, JSON.stringify(safeVideos, null, 2), "utf8");
}

export async function readProgress() {
  try {
    const raw = await fs.readFile(PROGRESS_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeProgress({});
      return {};
    }
    return {};
  }
}

export async function writeProgress(progress) {
  const safeProgress = progress && typeof progress === "object" && !Array.isArray(progress) ? progress : {};
  await fs.mkdir(path.dirname(PROGRESS_STORE_PATH), { recursive: true });
  await fs.writeFile(PROGRESS_STORE_PATH, JSON.stringify(safeProgress, null, 2), "utf8");
}

export async function deleteVideoAndProgress(videoId) {
  const numericId = Number(videoId);
  
  // 1. Delete video
  const videos = await readVideos();
  const filteredVideos = videos.filter((v) => Number(v.id) !== numericId);
  await writeVideos(filteredVideos);

  // 2. Delete progress records
  const progressDb = await readProgress();
  let modified = false;
  
  for (const userId in progressDb) {
    if (Array.isArray(progressDb[userId])) {
      const originalLength = progressDb[userId].length;
      progressDb[userId] = progressDb[userId].filter((p) => Number(p.video_id) !== numericId);
      if (progressDb[userId].length !== originalLength) {
        modified = true;
      }
    }
  }

  if (modified) {
    await writeProgress(progressDb);
  }
}
