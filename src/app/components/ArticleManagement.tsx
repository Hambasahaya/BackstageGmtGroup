import {
  Check,
  Edit3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { api, type ArticleDto, type ArticlePayload } from "../services/api";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Published
      </span>
    );
  }
  if (normalized === "archived") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-600/10">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Draft
    </span>
  );
}

export function ArticleManagement() {
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination (simple implementation for now, assuming max 100 items per request)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Modals state
  const [editingArticle, setEditingArticle] = useState<ArticleDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form inputs state
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formFeaturedImage, setFormFeaturedImage] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formSourceUrl, setFormSourceUrl] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSeoDesc, setFormSeoDesc] = useState("");
  const [formSeoCanonical, setFormSeoCanonical] = useState("");
  const [formPublishedAt, setFormPublishedAt] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadArticles = async (searchVal = debouncedSearch, currentPage = page, status = statusFilter) => {
    setIsLoading(true);
    try {
      const response = await api.articles({
        search: searchVal || undefined,
        status: status === "all" ? undefined : status,
        page: currentPage,
        limit,
      });
      setArticles(response.articles || []);
      setTotalPages(response.meta?.total_pages || 1);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal memuat artikel.";
      void Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#0F766E",
      });
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadArticles(debouncedSearch, page, statusFilter);
  }, [debouncedSearch, page, statusFilter]);

  const openForm = (article: ArticleDto | null = null) => {
    if (article) {
      setEditingArticle(article);
      setFormTitle(article.title || "");
      setFormSlug(article.slug || "");
      setFormExcerpt(article.excerpt || "");
      setFormContent(article.content || "");
      setFormFeaturedImage(article.featured_image || "");
      setFormAuthor(article.author || "");
      setFormSourceUrl(article.source_url || "");
      setFormStatus(article.status || "draft");
      setFormSeoTitle(article.seo?.title || "");
      setFormSeoDesc(article.seo?.description || "");
      setFormSeoCanonical(article.seo?.canonical_url || "");
      setFormPublishedAt(article.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : "");
    } else {
      setEditingArticle(null);
      setFormTitle("");
      setFormSlug("");
      setFormExcerpt("");
      setFormContent("");
      setFormFeaturedImage("");
      setFormAuthor("");
      setFormSourceUrl("");
      setFormStatus("draft");
      setFormSeoTitle("");
      setFormSeoDesc("");
      setFormSeoCanonical("");
      setFormPublishedAt("");
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formSlug.trim()) {
      void Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Judul dan Slug wajib diisi.",
        confirmButtonColor: "#0F766E",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: ArticlePayload = {
        title: formTitle,
        slug: formSlug,
        excerpt: formExcerpt,
        content: formContent,
        featured_image: formFeaturedImage,
        author: formAuthor,
        source_url: formSourceUrl,
        status: formStatus,
        seo: {
          title: formSeoTitle,
          description: formSeoDesc,
          canonical_url: formSeoCanonical,
        },
      };

      if (formPublishedAt) {
        payload.published_at = new Date(formPublishedAt).toISOString();
      }

      if (editingArticle) {
        await api.updateArticle(editingArticle.id, payload);
      } else {
        await api.createArticle(payload);
      }

      await Swal.fire({
        icon: "success",
        title: editingArticle ? "Artikel Diperbarui" : "Artikel Ditambahkan",
        text: "Data berhasil disimpan.",
        confirmButtonColor: "#0F766E",
      });

      setIsFormOpen(false);
      await loadArticles();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menyimpan artikel.";
      void Swal.fire({
        icon: "error",
        title: "Gagal",
        text: msg,
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = async (article: ArticleDto) => {
    const result = await Swal.fire({
      title: "Hapus Artikel?",
      text: `Apakah Anda yakin ingin menghapus "${article.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D33",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await api.deleteArticle(article.id);
      await Swal.fire({
        icon: "success",
        title: "Dihapus!",
        text: "Artikel berhasil dihapus.",
        confirmButtonColor: "#0F766E",
      });
      await loadArticles();
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: error instanceof Error ? error.message : "Gagal menghapus artikel.",
        confirmButtonColor: "#0F766E",
      });
    }
  };

  const stats = useMemo(() => {
    return {
      total: articles.length, // Displaying current page items count for simplicity, actual total needs a separate endpoint or from meta
    };
  }, [articles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">CMS</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Manajemen Artikel</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Kelola konten artikel untuk website, optimasi SEO, dan status publikasi secara terpusat.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => loadArticles()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-350 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => openForm(null)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115E59]"
          >
            <Plus className="h-4 w-4" />
            Tambah Artikel
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-[#0F766E] focus:bg-white focus:ring-[#0F766E]"
            placeholder="Cari judul atau ringkasan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="statusFilter" className="text-sm font-medium text-slate-700">
            Status:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
          >
            <option value="all">Semua</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900">Judul & Slug</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Penulis</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Tanggal Publish</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Memuat data artikel...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    Tidak ada artikel yang ditemukan.
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">{article.title}</div>
                      <div className="mt-1 text-xs text-slate-500 line-clamp-1 truncate max-w-xs">{article.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{article.author || "-"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={article.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {article.published_at ? dateFormatter.format(new Date(article.published_at)) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openForm(article)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-[#0F766E]"
                          title="Edit Artikel"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus Artikel"
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
        
        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <span className="text-sm text-slate-500">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-full w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingArticle ? "Edit Artikel" : "Tambah Artikel Baru"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form id="articleForm" onSubmit={handleFormSubmit} className="space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Judul Artikel *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value);
                        if (!editingArticle) {
                          setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                        }
                      }}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Slug URL *</label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">Unik dan digunakan pada URL (contoh: judul-artikel-keren).</p>
                  </div>

                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Ringkasan (Excerpt)</label>
                    <textarea
                      value={formExcerpt}
                      onChange={(e) => setFormExcerpt(e.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Konten Artikel (HTML)</label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      rows={8}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      placeholder="<h1>Judul</h1><p>Isi paragraf...</p>"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-t border-slate-100 pt-6">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Gambar Utama (URL)</label>
                    <input
                      type="text"
                      value={formFeaturedImage}
                      onChange={(e) => setFormFeaturedImage(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">URL Sumber Referensi</label>
                    <input
                      type="text"
                      value={formSourceUrl}
                      onChange={(e) => setFormSourceUrl(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Penulis</label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Publish</label>
                    <input
                      type="datetime-local"
                      value={formPublishedAt}
                      onChange={(e) => setFormPublishedAt(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* SEO Info */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="mb-4 text-sm font-bold text-slate-900">SEO Metadata</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">SEO Title</label>
                      <input
                        type="text"
                        value={formSeoTitle}
                        onChange={(e) => setFormSeoTitle(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">SEO Description</label>
                      <textarea
                        value={formSeoDesc}
                        onChange={(e) => setFormSeoDesc(e.target.value)}
                        rows={2}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">Canonical URL</label>
                      <input
                        type="text"
                        value={formSeoCanonical}
                        onChange={(e) => setFormSeoCanonical(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="articleForm"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isSaving ? "Menyimpan..." : "Simpan Artikel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
