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
import { api, type ArticleDto, type ArticlePayload, type ProductDto } from "../services/api";
import { RichTextEditor } from "./RichTextEditor";

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

function MultiSelectCheckbox({ 
  items, 
  selectedIds, 
  onChange, 
  placeholder = "Cari..." 
}: { 
  items: { id: number; label: string }[]; 
  selectedIds: number[]; 
  onChange: (ids: number[]) => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  
  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(val => val !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-300 bg-white p-2">
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="block w-full rounded-md border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 border focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
      />
      <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 text-center">Tidak ada data.</p>
        ) : (
          filteredItems.map(item => (
            <label key={item.id} className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleSelection(item.id)}
                className="mt-0.5 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span className="text-sm text-slate-700 leading-snug">{item.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export function ArticleManagement() {
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const [allArticles, setAllArticles] = useState<ArticleDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const articleCategories = useMemo(() => {
    const cats = allArticles
      .map((a) => a.category)
      .filter((c): c is string => typeof c === "string" && c.trim() !== "");
    return Array.from(new Set(cats));
  }, [allArticles]);

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
  const [formCategory, setFormCategory] = useState("");
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
  const [formGallery, setFormGallery] = useState("");
  const [formRelatedProducts, setFormRelatedProducts] = useState<number[]>([]);
  const [formRelatedArticles, setFormRelatedArticles] = useState<number[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadArticles = async (searchVal = debouncedSearch, currentPage = page, status = statusFilter, category = categoryFilter) => {
    setIsLoading(true);
    try {
      const response = await api.articles({
        search: searchVal || undefined,
        status: status === "all" ? undefined : status,
        category: category === "all" ? undefined : category,
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
    void loadArticles(debouncedSearch, page, statusFilter, categoryFilter);
  }, [debouncedSearch, page, statusFilter, categoryFilter]);

  useEffect(() => {
    // Load products and all articles for the multi-select fields
    void api.products().then((res) => setAllProducts(res.products || []));
    void api.articles({ limit: 100 }).then((res) => setAllArticles(res.articles || []));
  }, []);

  const openForm = (article: ArticleDto | null = null) => {
    if (article) {
      setEditingArticle(article);
      setFormTitle(article.title || "");
      setFormSlug(article.slug || "");
      setFormCategory(article.category || "");
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
      setFormGallery((article.metadata?.gallery || []).join("\n"));
      setFormRelatedProducts(article.metadata?.related_products || []);
      setFormRelatedArticles(article.metadata?.related_articles || []);
    } else {
      setEditingArticle(null);
      setFormTitle("");
      setFormSlug("");
      setFormCategory("");
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
      setFormGallery("");
      setFormRelatedProducts([]);
      setFormRelatedArticles([]);
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
      const galleryUrls = formGallery.split("\n").map(u => u.trim()).filter(u => u !== "");
      
      const payload: ArticlePayload = {
        title: formTitle,
        slug: formSlug,
        category: formCategory,
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
        metadata: {
          gallery: galleryUrls,
          related_products: formRelatedProducts,
          related_articles: formRelatedArticles,
        }
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
      void api.articles({ limit: 100 }).then((res) => setAllArticles(res.articles || []));
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
      void api.articles({ limit: 100 }).then((res) => setAllArticles(res.articles || []));
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
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="categoryFilter" className="text-sm font-medium text-slate-700">
              Kategori:
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="all">Semua Kategori</option>
              {articleCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900">Judul & Slug</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Kategori</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Penulis</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Tanggal Publish</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Memuat data artikel...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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
                    <td className="px-6 py-4">
                      {article.category ? (
                        <span className="inline-flex items-center rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
                          {article.category}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
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
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Slug URL *</label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="Contoh: Media, Case Studies"
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
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
                    <label className="mb-1 block text-sm font-medium text-slate-700">Konten Artikel (Word & Visual)</label>
                    <RichTextEditor
                      value={formContent}
                      onChange={setFormContent}
                      placeholder="Tulis konten artikel Anda di sini..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-t border-slate-100 pt-6">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Gambar Utama (Featured Image)</label>
                    <input
                      type="text"
                      value={formFeaturedImage}
                      onChange={(e) => setFormFeaturedImage(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Galeri Carousel (1 URL per baris)</label>
                    <textarea
                      value={formGallery}
                      onChange={(e) => setFormGallery(e.target.value)}
                      rows={3}
                      placeholder="https://url.com/img1.jpg&#10;https://url.com/img2.jpg"
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700 flex justify-between">
                      <span>Products Employed</span>
                      <span className="text-xs text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded-full">{formRelatedProducts.length} dipilih</span>
                    </label>
                    <MultiSelectCheckbox
                      items={allProducts.map(p => ({ id: p.id, label: p.namaproduct }))}
                      selectedIds={formRelatedProducts}
                      onChange={setFormRelatedProducts}
                      placeholder="Cari produk..."
                    />
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700 flex justify-between">
                      <span>Similar Posts</span>
                      <span className="text-xs text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded-full">{formRelatedArticles.length} dipilih</span>
                    </label>
                    <MultiSelectCheckbox
                      items={allArticles.filter(a => a.id !== editingArticle?.id).map(a => ({ id: a.id, label: a.title }))}
                      selectedIds={formRelatedArticles}
                      onChange={setFormRelatedArticles}
                      placeholder="Cari artikel..."
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
