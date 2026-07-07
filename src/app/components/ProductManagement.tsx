import {
  AlertCircle,
  Check,
  Edit3,
  Eye,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { api, resolveApiAssetUrl, type ProductDto } from "../services/api";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "tersedia") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Tersedia
      </span>
    );
  }
  if (normalized === "habis") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Habis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-600/10">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Draft / Nonaktif
    </span>
  );
}

export function ProductManagement() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [failedImageIds, setFailedImageIds] = useState<Record<number, boolean>>({});

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form inputs state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formPrice, setFormPrice] = useState<number | "">("");
  const [formStatus, setFormStatus] = useState("tersedia");
  const [formKomisi, setFormKomisi] = useState<number | "">("");
  const [formPhotoPath, setFormPhotoPath] = useState(""); // For editing manually or viewing path
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load products list
  const loadProducts = async (searchVal = debouncedSearch) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await api.products(searchVal || undefined);
      setProducts(response.products || []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal memuat daftar produk.";
      setErrorMessage(msg);
      void Swal.fire({
        icon: "error",
        title: "Gagal Memuat Produk",
        text: msg,
        confirmButtonColor: "#0F766E",
      });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts(debouncedSearch);
  }, [debouncedSearch]);

  // Handle open Form modal (create/edit)
  const openForm = (product: ProductDto | null = null) => {
    setValidationErrors([]);
    setErrorMessage("");
    setSelectedFile(null);
    setFilePreview(null);

    if (product) {
      setEditingProduct(product);
      setFormName(product.namaproduct || "");
      setFormDescription(product.deskripsi || "");
      setFormUnit(product.unit || "");
      setFormPrice(product.price ?? "");
      setFormStatus(product.status || "tersedia");
      setFormKomisi(product.komisi ?? "");
      setFormPhotoPath(product.foto || "");
    } else {
      setEditingProduct(null);
      setFormName("");
      setFormDescription("");
      setFormUnit("paket");
      setFormPrice("");
      setFormStatus("tersedia");
      setFormKomisi(0);
      setFormPhotoPath("");
    }
    setIsFormOpen(true);
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Limit file size to 2MB
      if (file.size > 2 * 1024 * 1024) {
        void Swal.fire({
          icon: "warning",
          title: "File Terlalu Besar",
          text: "Ukuran file foto maksimal adalah 2 MB.",
          confirmButtonColor: "#0F766E",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit create or edit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setErrorMessage("");

    // Basic frontend validation
    const errors: string[] = [];
    if (!formName.trim()) errors.push("Nama produk wajib diisi.");
    if (formName.length > 150) errors.push("Nama produk maksimal 150 karakter.");
    if (!formUnit.trim()) errors.push("Unit wajib diisi.");
    if (formUnit.length > 50) errors.push("Unit maksimal 50 karakter.");
    if (formPrice === "" || Number(formPrice) < 1) errors.push("Harga produk minimal bernilai 1.");
    if (formKomisi !== "" && Number(formKomisi) < 0) errors.push("Komisi minimal bernilai 0.");

    if (errors.length > 0) {
      setValidationErrors(errors);
      void Swal.fire({
        icon: "warning",
        title: "Validasi Form Gagal",
        text: "Silakan periksa kembali isian formulir Anda.",
        confirmButtonColor: "#0F766E",
      });
      return;
    }

    setIsSaving(true);
    try {
      let response;
      const parsedPrice = Number(formPrice);
      const parsedKomisi = formKomisi === "" ? 0 : Number(formKomisi);

      // We support file upload or JSON path submission
      const useMultipart = !!selectedFile;

      if (useMultipart) {
        const formData = new FormData();
        formData.append("namaproduct", formName);
        formData.append("deskripsi", formDescription);
        formData.append("unit", formUnit);
        formData.append("price", String(parsedPrice));
        formData.append("status", formStatus);
        formData.append("komisi", String(parsedKomisi));
        formData.append("foto", selectedFile);

        if (editingProduct) {
          response = await api.updateProduct(editingProduct.id, formData);
        } else {
          response = await api.createProduct(formData);
        }
      } else {
        // Submit via JSON
        const payload = {
          namaproduct: formName,
          deskripsi: formDescription,
          unit: formUnit,
          price: parsedPrice,
          status: formStatus,
          komisi: parsedKomisi,
          ...(formPhotoPath ? { foto: formPhotoPath } : {}),
        };

        if (editingProduct) {
          response = await api.updateProduct(editingProduct.id, payload);
        } else {
          response = await api.createProduct(payload);
        }
      }

      await Swal.fire({
        icon: "success",
        title: editingProduct ? "Produk Diperbarui" : "Produk Ditambahkan",
        text: response.message || "Data produk berhasil disimpan.",
        confirmButtonColor: "#0F766E",
      });

      setIsFormOpen(false);
      await loadProducts();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan tidak terduga.";
      if (msg.includes("Key:") || msg.includes("validation")) {
        setValidationErrors([msg]);
      } else {
        setErrorMessage(msg);
      }

      void Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan Produk",
        text: msg,
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (product: ProductDto) => {
    const result = await Swal.fire({
      title: "Hapus Produk?",
      text: `Apakah Anda yakin ingin menghapus "${product.namaproduct}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D33",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await api.deleteProduct(product.id);
      await Swal.fire({
        icon: "success",
        title: "Dihapus!",
        text: response.message || "Produk berhasil dihapus.",
        confirmButtonColor: "#0F766E",
      });
      await loadProducts();
      if (selectedProduct?.id === product.id) {
        setSelectedProduct(null);
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: error instanceof Error ? error.message : "Gagal menghapus produk.",
        confirmButtonColor: "#0F766E",
      });
    }
  };

  // Filtered products list for rendering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (statusFilter === "all") return true;
      return (product.status || "").toLowerCase() === statusFilter.toLowerCase();
    });
  }, [products, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    let tersedia = 0;
    let habis = 0;
    let draft = 0;

    products.forEach((p) => {
      const st = (p.status || "").toLowerCase();
      if (st === "tersedia") tersedia++;
      else if (st === "habis") habis++;
      else draft++;
    });

    return {
      total: products.length,
      tersedia,
      habis,
      draft,
    };
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Manajemen Produk</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Kelola data katalog produk, status ketersediaan, komisi dasar, dan lihat struktur tiered commission agent.
          </p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115E59] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Stats Board */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Katalog</p>
            <Package className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-200" />
        </div>

        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Tersedia</p>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-950">{stats.tersedia}</p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500" />
        </div>

        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Habis</p>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-950">{stats.habis}</p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-rose-500" />
        </div>

        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Draft / Nonaktif</p>
            <span className="h-2 w-2 rounded-full bg-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-950">{stats.draft}</p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-400" />
        </div>
      </section>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama produk, deskripsi..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">Semua Status</option>
              <option value="tersedia">Tersedia</option>
              <option value="habis">Habis</option>
              <option value="draft">Draft / Nonaktif</option>
            </select>

            <button
              onClick={() => void loadProducts()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
              Refresh
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
              <p className="mt-3 text-sm font-medium">Memuat katalog produk...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const hasTiers = product.commission_tiers && Object.keys(product.commission_tiers).length > 0;
                return (
                  <div
                    key={product.id}
                    className="group flex flex-col h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* Card Header Image */}
                    <div className="relative aspect-[4/3] w-full bg-slate-100">
                      {product.foto && !failedImageIds[product.id] ? (
                        <img
                          src={resolveApiAssetUrl(product.foto)}
                          alt={product.namaproduct}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={() => {
                            setFailedImageIds((prev) => ({ ...prev, [product.id]: true }));
                          }}
                        />
                      ) : null}

                      {/* Fallback Placeholder */}
                      {(!product.foto || failedImageIds[product.id]) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 p-4 text-slate-400">
                          <Package className="h-10 w-10 text-slate-300 transition duration-300 group-hover:scale-110" />
                          <span className="mt-2 text-[11px] font-medium tracking-wide uppercase text-slate-400">
                            No Photo
                          </span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute right-3 top-3">
                        <StatusBadge status={product.status || ""} />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-[#0F766E] transition">
                          {product.namaproduct}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                          {product.unit ? `/ ${product.unit}` : ""}
                        </p>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Harga Jual</span>
                            <span className="text-sm font-bold text-slate-900">
                              {currencyFormatter.format(product.price)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Komisi Dasar</span>
                            <span className="text-sm font-semibold text-teal-600">
                              {currencyFormatter.format(product.komisi || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Tiered Commission Preview */}
                        {hasTiers && (
                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <p className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              <Layers className="h-3.5 w-3.5 text-slate-400" />
                              Komisi Agent Tiers
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-slate-50 p-2 text-xs">
                              {Object.entries(product.commission_tiers!)
                                .slice(0, 4)
                                .map(([tier, value]) => (
                                  <div key={tier} className="flex justify-between text-slate-600">
                                    <span className="font-semibold text-slate-500">{tier}</span>
                                    <span>{currencyFormatter.format(value)}</span>
                                  </div>
                                ))}
                              {Object.keys(product.commission_tiers!).length > 4 && (
                                <span className="col-span-2 text-center text-[10px] text-teal-600 font-semibold mt-1">
                                  +{Object.keys(product.commission_tiers!).length - 4} Tiers Lainnya
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-5 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                          title="Detail Produk"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detail
                        </button>
                        <button
                          onClick={() => openForm(product)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
                          title="Edit Produk"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDeleteProduct(product)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Package className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm font-semibold">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter status Anda.</p>
            </div>
          )}
        </div>
      </section>

      {/* CREATE & EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(e) => void handleFormSubmit(e)}
            className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-950/10 transition-all duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProduct ? "Edit Data Produk" : "Tambah Produk Baru"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Isi formulir secara lengkap. Kolom dengan tanda bintang (<span className="text-rose-500">*</span>)
                  wajib diisi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Validation Feedback */}
            {validationErrors.length > 0 && (
              <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <div className="text-xs font-semibold text-rose-800">Harap perbaiki kesalahan berikut:</div>
                </div>
                <ul className="mt-2 list-inside list-disc text-xs text-rose-700 space-y-0.5 pl-2">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Body */}
            <div className="space-y-4 p-6">
              {/* Product Name */}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nama Produk <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: GMT Lighting Package"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </label>

              {/* Price & Unit & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Harga Jual (IDR) <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Contoh: 20000000"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Unit Satuan <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="Contoh: paket, unit, pcs"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status Produk
                  </span>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="tersedia">Tersedia</option>
                    <option value="habis">Habis</option>
                    <option value="draft">Draft / Nonaktif</option>
                  </select>
                </label>
              </div>

              {/* Commission */}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Komisi Dasar Agen (IDR)
                </span>
                <input
                  type="number"
                  min={0}
                  value={formKomisi}
                  onChange={(e) => setFormKomisi(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Contoh: 1000000"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </label>

              {/* Photo Input options */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Foto Produk
                </span>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* File Upload Selector */}
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition-all hover:bg-slate-100/50">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="h-8 w-8 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#115E59]"
                    >
                      Pilih File Foto
                    </button>
                    <p className="mt-1 text-[10px] text-slate-400">PNG, JPG, JPEG max 2MB</p>
                  </div>

                  {/* String Image Path Input (alternative) */}
                  <div className="flex flex-col justify-center rounded-xl border border-slate-200 p-4 bg-white">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      Atau Masukkan Path / URL
                    </span>
                    <input
                      type="text"
                      maxLength={255}
                      value={formPhotoPath}
                      onChange={(e) => {
                        setFormPhotoPath(e.target.value);
                        // Clear selected file if path edited manually to avoid confusion
                        if (selectedFile) {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }
                      }}
                      placeholder="Contoh: uploads/products/nama-file.jpg"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-[#0F766E]"
                    />
                  </div>
                </div>

                {/* Previews */}
                {(filePreview || formPhotoPath) && (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-300 bg-white">
                      <img
                        src={filePreview || resolveApiAssetUrl(formPhotoPath)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {selectedFile ? selectedFile.name : "Tautan Gambar"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {selectedFile
                          ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                          : formPhotoPath || "Tautan eksternal"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        setFormPhotoPath("");
                      }}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Deskripsi Produk
                </span>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={4}
                  placeholder="Berikan deskripsi detail tentang produk..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 p-6 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Simpan Produk
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAIL DRAWER / POPUP */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-950/10 transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900">{selectedProduct.namaproduct}</h2>
                  <StatusBadge status={selectedProduct.status || ""} />
                </div>
                <p className="mt-1 text-xs text-slate-500">ID Produk: {selectedProduct.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Photo Column */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center aspect-[4/3] relative">
                  {selectedProduct.foto && !failedImageIds[selectedProduct.id] ? (
                    <img
                      src={resolveApiAssetUrl(selectedProduct.foto)}
                      alt={selectedProduct.namaproduct}
                      className="h-full w-full object-cover"
                      onError={() => {
                        setFailedImageIds((prev) => ({ ...prev, [selectedProduct.id]: true }));
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                      <Package className="h-12 w-12 text-slate-300" />
                      <span className="mt-2 text-xs font-semibold text-slate-400">Tidak Ada Foto</span>
                    </div>
                  )}
                </div>

                {/* Main Details Column */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Harga Jual / Unit
                    </span>
                    <p className="mt-1 text-xl font-extrabold text-slate-900">
                      {currencyFormatter.format(selectedProduct.price)}
                      <span className="text-xs font-bold text-slate-400 uppercase ml-1">
                        / {selectedProduct.unit || "unit"}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Komisi Dasar Agen
                    </span>
                    <p className="mt-1 text-lg font-bold text-teal-600">
                      {currencyFormatter.format(selectedProduct.komisi || 0)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Dibuat Pada
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {selectedProduct.created_at
                          ? dateFormatter.format(new Date(selectedProduct.created_at))
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Pembaruan Terakhir
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {selectedProduct.updated_at
                          ? dateFormatter.format(new Date(selectedProduct.updated_at))
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Tiers Section */}
              {selectedProduct.commission_tiers && Object.keys(selectedProduct.commission_tiers).length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#0F766E]" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Tiering Komisi Agen Resmi
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {Object.entries(selectedProduct.commission_tiers).map(([tier, value]) => (
                      <div
                        key={tier}
                        className="flex flex-col rounded-lg bg-white border border-slate-150 p-2.5 shadow-sm text-center"
                      >
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">{tier}</span>
                        <span className="mt-1 text-xs font-bold text-slate-900">
                          {currencyFormatter.format(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Section */}
              {selectedProduct.deskripsi && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Deskripsi Produk
                  </h3>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">
                    {selectedProduct.deskripsi}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-700 transition"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
