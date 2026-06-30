import { CheckCircle2, Clock3, Lock, PlayCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, resolveApiAssetUrl, type OnboardingProgressDto, type OnboardingSummaryDto, type OnboardingVideoDto } from "../services/api";

const emptySummary: OnboardingSummaryDto = {
  completed_count: 0,
  total_required: 0,
  completion_percent: 0,
  is_completed: false,
  progress: [],
};

const forcedOnboardingVideoUrls = [
  "https://youtu.be/iWmqw7PqAgs?si=S0Q5G0jIyPLLv_za",
  "https://www.youtube.com/watch?v=Mjm_g8WKa20",
  "https://www.youtube.com/watch?v=aNwhxCN2dyg",
];

function getYoutubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const videoId = url.hostname.includes("youtu.be") ? url.pathname.slice(1) : url.searchParams.get("v");

    if (!videoId) {
      return "";
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return "";
  }
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatWatchedAt = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function getProgressForVideo(progress: OnboardingProgressDto[] | unknown, videoId: number) {
  if (!Array.isArray(progress)) {
    return undefined;
  }

  return progress.find((item) => item.video_id === videoId);
}

function normalizeProgressList(progress: unknown): OnboardingProgressDto[] {
  if (Array.isArray(progress)) {
    return progress as OnboardingProgressDto[];
  }

  if (progress && typeof progress === "object" && "video_id" in progress) {
    return [progress as OnboardingProgressDto];
  }

  return [];
}

function upsertProgress(
  progress: OnboardingProgressDto[],
  nextProgress: OnboardingProgressDto,
) {
  const existingIndex = progress.findIndex((item) => item.video_id === nextProgress.video_id);

  if (existingIndex === -1) {
    return [...progress, nextProgress];
  }

  return progress.map((item, index) => (index === existingIndex ? { ...item, ...nextProgress } : item));
}

function normalizeSummary(summary: OnboardingSummaryDto | null | undefined): OnboardingSummaryDto {
  const nextSummary = summary ?? emptySummary;

  return {
    ...emptySummary,
    ...nextSummary,
    progress: normalizeProgressList(nextSummary.progress),
  };
}

export function AgentOnboarding() {
  const [videos, setVideos] = useState<OnboardingVideoDto[]>([]);
  const [summary, setSummary] = useState<OnboardingSummaryDto>(emptySummary);
  const [videoErrors, setVideoErrors] = useState<Record<number, string>>({});
  const [savingVideoIds, setSavingVideoIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadOnboarding = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [videoResponse, progressResponse] = await Promise.all([api.onboardingVideos(), api.onboardingProgress()]);
      const nextVideos = Array.isArray(videoResponse.videos) ? videoResponse.videos : [];
      setVideos([...nextVideos].sort((a, b) => a.sort_order - b.sort_order));
      setSummary(normalizeSummary(progressResponse));
      setVideoErrors({});
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat onboarding agent.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOnboarding();
  }, []);

  const progressRows = useMemo(
    () =>
      videos.map((video, index) => {
        const progress = getProgressForVideo(summary.progress, video.id);
        const previousVideo = videos[index - 1];
        const previousProgress = previousVideo ? getProgressForVideo(summary.progress, previousVideo.id) : undefined;
        const isWatched = progress?.status === "completed";
        const isUnlocked = index === 0 || previousProgress?.status === "completed";

        return {
          ...video,
          index,
          forcedYoutubeUrl: getYoutubeEmbedUrl(forcedOnboardingVideoUrls[index] ?? ""),
          resolvedVideoUrl: resolveApiAssetUrl(video.video_url),
          isWatched,
          isUnlocked,
          watchedAt: progress?.completed_at,
        };
      }),
    [summary.progress, videos],
  );

  const saveProgress = async (video: OnboardingVideoDto, watchedSeconds: number, status: "in_progress" | "completed") => {
    const durationSeconds = Math.max(1, Math.round(video.duration_seconds || watchedSeconds || 1));
    const nextWatchedSeconds = status === "completed" ? durationSeconds : Math.max(0, Math.round(watchedSeconds));

    setSavingVideoIds((current) => (current.includes(video.id) ? current : [...current, video.id]));
    setErrorMessage("");

    try {
      const nextSummary = await api.saveOnboardingProgress({
        video_id: video.id,
        watched_seconds: nextWatchedSeconds,
        duration_seconds: durationSeconds,
        status,
      });
      const normalizedSummary = normalizeSummary(nextSummary);
      const savedProgress = getProgressForVideo(normalizedSummary.progress, video.id) ?? {
        video_id: video.id,
        slug: video.slug,
        watched_seconds: nextWatchedSeconds,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : undefined,
      };

      setSummary((current) => {
        const mergedProgress = upsertProgress(current.progress, savedProgress);
        const completedCount = mergedProgress.filter((item) => item.status === "completed").length;
        const totalRequired = normalizedSummary.total_required || current.total_required || videos.length;

        return {
          ...current,
          ...normalizedSummary,
          progress: mergedProgress,
          completed_count: normalizedSummary.completed_count || completedCount,
          total_required: totalRequired,
          completion_percent:
            normalizedSummary.completion_percent || (totalRequired ? Math.round((completedCount / totalRequired) * 100) : 0),
          is_completed: normalizedSummary.is_completed || (totalRequired > 0 && completedCount >= totalRequired),
        };
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan progress video.");
    } finally {
      setSavingVideoIds((current) => current.filter((videoId) => videoId !== video.id));
    }
  };

  const resetProgress = async () => {
    try {
      await api.resetOnboardingProgress();
      await loadOnboarding();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal reset progress onboarding.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Agent Onboarding</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Video training wajib role agent</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Materi onboarding dari API agent dengan progress tonton berurutan.
          </p>
        </div>
        <button
          onClick={resetProgress}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset progress
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">Progress selesai</p>
          <p className="mt-2 text-xl sm:text-3xl font-bold text-slate-950">{summary.completion_percent}%</p>
          <div className="mt-3 sm:mt-4 h-1.5 sm:h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#0F766E]" style={{ width: `${summary.completion_percent}%` }} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">Video ditonton</p>
          <p className="mt-2 text-xl sm:text-3xl font-bold text-slate-950">
            {summary.completed_count}/{summary.total_required || videos.length}
          </p>
          <p className="mt-2 sm:mt-3 text-[10px] sm:text-sm text-slate-500 line-clamp-1">Progress tontonan agent</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">Status onboarding</p>
          <p className="mt-2 text-base sm:text-lg font-bold text-slate-950 line-clamp-1">{summary.is_completed ? "Completed" : "In progress"}</p>
          <p className="mt-2 sm:mt-3 text-[10px] sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1">
            {summary.is_completed ? "Semua materi agent selesai" : "Selesaikan video sesuai urutan"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">Akses</p>
          <div className="mt-2 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-teal-50 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
            <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4" />
            Agent
          </div>
          <p className="mt-2 sm:mt-3 text-[10px] sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1">Materi khusus onboarding agent</p>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">Memuat video onboarding...</div>
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {progressRows.map((video) => (
            <article
              key={video.id}
              className={`overflow-hidden rounded-lg border bg-white shadow-sm ${
                video.isUnlocked ? "border-slate-200" : "border-slate-200 opacity-70"
              }`}
            >
              <div className="relative aspect-video bg-slate-950">
                {video.isUnlocked ? (
                  video.forcedYoutubeUrl ? (
                    <iframe
                      className="h-full w-full"
                      src={video.forcedYoutubeUrl}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : video.resolvedVideoUrl ? (
                    <>
                      <video
                        className="h-full w-full object-cover"
                        controls
                        preload="metadata"
                        src={video.resolvedVideoUrl}
                        onError={() =>
                          setVideoErrors((current) => ({
                            ...current,
                            [video.id]: "Video gagal dimuat. Periksa file, URL asset, atau akses static backend.",
                          }))
                        }
                        onPause={(event) => void saveProgress(video, event.currentTarget.currentTime, "in_progress")}
                        onEnded={() => void saveProgress(video, video.duration_seconds, "completed")}
                      />
                      {videoErrors[video.id] && (
                        <div className="absolute inset-x-3 bottom-3 rounded-md bg-rose-600/90 px-3 py-2 text-xs font-medium text-white">
                          {videoErrors[video.id]}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 text-white">
                      <PlayCircle className="h-8 w-8" />
                      <span className="text-sm font-semibold">URL video kosong</span>
                    </div>
                  )
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 text-white">
                    <Lock className="h-8 w-8" />
                    <span className="text-sm font-semibold">Locked</span>
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-900">
                  Video {video.index + 1}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">{video.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{video.description}</p>
                  </div>
                  {video.isWatched ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : video.isUnlocked ? (
                    <PlayCircle className="h-5 w-5 shrink-0 text-[#0F766E]" />
                  ) : (
                    <Lock className="h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDuration(video.duration_seconds)}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                      video.isWatched
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : video.isUnlocked
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {video.isWatched ? "Sudah ditonton" : video.isUnlocked ? "Belum selesai" : "Menunggu video sebelumnya"}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {video.watchedAt ? `Terekam: ${formatWatchedAt(video.watchedAt)}` : "Belum ada rekaman selesai tonton"}
                </div>

                {video.isUnlocked && !video.isWatched && (
                  <button
                    type="button"
                    onClick={() => void saveProgress(video, video.duration_seconds, "completed")}
                    disabled={savingVideoIds.includes(video.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {savingVideoIds.includes(video.id) ? "Menyimpan..." : "Tandai selesai"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
