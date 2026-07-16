import { CheckCircle2, Clock3, Edit2, GraduationCap, Lock, PlusCircle, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type OnboardingVideoDto, type OnboardingVideoPayload } from "../services/api";
import Swal from "sweetalert2";

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export function SuperAdminOnboardingVideos() {
  const [videos, setVideos] = useState<OnboardingVideoDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formDuration, setFormDuration] = useState<number>(300);
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formIsRequired, setFormIsRequired] = useState(true);
  const [formSlug, setFormSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVideos = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.adminOnboardingVideos();
      setVideos(response.videos);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat video onboarding.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadVideos();
  }, []);

  const filteredVideos = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return [...videos]
      .filter((video) =>
        [video.title, video.slug, video.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      )
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [searchTerm, videos]);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedVideoId(null);
    setFormTitle("");
    setFormDescription("");
    setFormVideoUrl("");
    setFormDuration(300);
    setFormSortOrder(videos.length > 0 ? Math.max(...videos.map(v => v.sort_order)) + 1 : 1);
    setFormIsRequired(true);
    setFormSlug("");
    setShowModal(true);
  };

  const handleOpenEditModal = (video: OnboardingVideoDto) => {
    setModalMode("edit");
    setSelectedVideoId(video.id);
    setFormTitle(video.title);
    setFormDescription(video.description ?? "");
    setFormVideoUrl(video.video_url);
    setFormDuration(video.duration_seconds);
    setFormSortOrder(video.sort_order);
    setFormIsRequired(video.is_required);
    setFormSlug(video.slug);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formTitle.trim()) {
      void Swal.fire("Validasi Gagal", "Judul video wajib diisi.", "warning");
      return;
    }
    if (!formVideoUrl.trim()) {
      void Swal.fire("Validasi Gagal", "Link video URL wajib diisi.", "warning");
      return;
    }
    if (formDuration < 1) {
      void Swal.fire("Validasi Gagal", "Durasi video minimal 1 detik.", "warning");
      return;
    }

    setIsSubmitting(true);
    const payload: OnboardingVideoPayload = {
      title: formTitle,
      description: formDescription,
      video_url: formVideoUrl,
      duration_seconds: formDuration,
      sort_order: formSortOrder,
      is_required: formIsRequired,
      slug: formSlug,
    };

    try {
      if (modalMode === "add") {
        await api.adminCreateOnboardingVideo(payload);
        void Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Video onboarding baru berhasil ditambahkan.",
          confirmButtonColor: "#0F766E",
        });
      } else {
        if (selectedVideoId !== null) {
          await api.adminUpdateOnboardingVideo(selectedVideoId, payload);
          void Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Video onboarding berhasil diperbarui.",
            confirmButtonColor: "#0F766E",
          });
        }
      }
      setShowModal(false);
      await loadVideos();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menyimpan video.";
      void Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: msg,
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (video: OnboardingVideoDto) => {
    const result = await Swal.fire({
      title: "Hapus Video?",
      text: `Apakah Anda yakin ingin menghapus video "${video.title}"? Menghapus video ini juga akan menghapus seluruh data progress tontonan agent untuk video ini.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D33",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await api.adminDeleteOnboardingVideo(video.id);
      await loadVideos();
      void Swal.fire({
        icon: "success",
        title: "Dihapus!",
        text: "Video onboarding berhasil dihapus.",
        confirmButtonColor: "#0F766E",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menghapus video.";
      void Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: msg,
        confirmButtonColor: "#0F766E",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Manajemen Onboarding Videos</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Kelola daftar video training yang wajib ditonton secara berurutan oleh agent baru.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-200">
          <ShieldCheck className="h-4 w-4" />
          Super admin
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Video</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{videos.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Video Wajib</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {videos.filter((v) => v.is_required).length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Durasi</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatDuration(videos.reduce((acc, v) => acc + v.duration_seconds, 0))}
          </p>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul/slug/deskripsi..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 sm:w-72"
              />
            </div>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#115E59] transition"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Video
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-semibold w-16 text-center">Urutan</th>
                <th className="px-4 py-3 font-semibold">Video</th>
                <th className="px-4 py-3 font-semibold">URL Video</th>
                <th className="px-4 py-3 font-semibold w-24">Durasi</th>
                <th className="px-4 py-3 font-semibold w-28 text-center">Wajib</th>
                <th className="px-4 py-3 font-semibold w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Memuat data video...
                  </td>
                </tr>
              ) : filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Tidak ada video onboarding yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredVideos.map((video) => (
                  <tr key={video.id} className="border-b border-slate-100 text-sm last:border-0 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 text-center font-bold text-[#0F766E]">{video.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-950">{video.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">slug: {video.slug}</div>
                      {video.description && (
                        <div className="text-xs text-slate-600 mt-1 line-clamp-1 max-w-sm">{video.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all"
                      >
                        {video.video_url}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {formatDuration(video.duration_seconds)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {video.is_required ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                          Wajib
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                          Opsional
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(video)}
                          title="Edit video"
                          className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void handleDelete(video)}
                          title="Hapus video"
                          className="rounded p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#0F766E]" />
                {modalMode === "add" ? "Tambah Video Onboarding" : "Edit Video Onboarding"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Judul Video *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Pengenalan Role Agent"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Slug (Opsional)</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="Generate otomatis jika dikosongkan"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Deskripsi</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Penjelasan ringkas mengenai isi video..."
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Link Video URL *</label>
                <input
                  type="url"
                  required
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=xxxx"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Durasi (Detik) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Urutan Tonton *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={formIsRequired}
                  onChange={(e) => setFormIsRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                />
                <label htmlFor="isRequired" className="text-sm font-medium text-slate-700 select-none">
                  Video wajib diselesaikan untuk onboarding agent
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] transition disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
