import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Headphones,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  api,
  type CustomerCareTicketDto,
  type CustomerCareTicketStatus,
} from "../services/api";

const statusOptions: { value: CustomerCareTicketStatus; label: string; color: string }[] = [
  { value: "diterima", label: "Diterima", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "diproses", label: "Diproses", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "menunggu_customer", label: "Menunggu Customer", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "selesai", label: "Selesai", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

function formatLabel(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === "string" && obj.name) return obj.name;
    if (typeof obj.label === "string" && obj.label) return obj.label;
    if (typeof obj.title === "string" && obj.title) return obj.title;
    if (typeof obj.key === "string" && obj.key) return formatLabel(obj.key);
    return "-";
  }
  const str = String(value).trim();
  if (!str) return "-";
  return str.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }: { status: CustomerCareTicketStatus | string }) {
  const opt = statusOptions.find((o) => o.value === status);
  const colorClass = opt?.color || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      {opt?.label || formatLabel(status)}
    </span>
  );
}

export function AdminCustomerCare() {
  const [tickets, setTickets] = useState<CustomerCareTicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  /* Modals */
  const [selectedTicket, setSelectedTicket] = useState<CustomerCareTicketDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  /* Update Status state */
  const [newStatus, setNewStatus] = useState<CustomerCareTicketStatus>("diproses");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.adminCustomerCareTickets();
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat tiket customer care admin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
  }, []);

  const fetchTicketDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await api.adminCustomerCareTicketDetail(id);
      if (res.data) {
        setSelectedTicket(res.data);
        setNewStatus(res.data.status);
        setStatusNote("");
      }
    } catch (_err) {
      // Keep existing selectedTicket if detail API fails
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = (ticket: CustomerCareTicketDto) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setStatusNote("");
    void fetchTicketDetail(ticket.id);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUpdatingStatus(true);
    try {
      await api.adminUpdateCustomerCareTicketStatus(selectedTicket.id, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "Status Tiket Diperbarui",
        text: `Status tiket ${selectedTicket.ticket_number} berhasil diubah menjadi ${formatLabel(newStatus)}.`,
        confirmButtonColor: "#0F766E",
      });

      setSelectedTicket(null);
      await fetchTickets();
    } catch (err) {
      void Swal.fire({
        icon: "error",
        title: "Gagal Mengubah Status",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui status.",
        confirmButtonColor: "#0F766E",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = t.ticket_number?.toLowerCase().includes(q);
        const matchReporter = t.reporter_name?.toLowerCase().includes(q);
        const matchPhone = t.reporter_phone?.toLowerCase().includes(q);
        const matchSubject = t.subject?.toLowerCase().includes(q);
        const matchSN = t.serial_number?.toLowerCase().includes(q);
        const matchInvoice = t.invoice_number?.toLowerCase().includes(q);
        if (!matchNumber && !matchReporter && !matchPhone && !matchSubject && !matchSN && !matchInvoice) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  const kpiStats = useMemo(() => {
    return {
      total: tickets.length,
      diterima: tickets.filter((t) => t.status === "diterima").length,
      diproses: tickets.filter((t) => t.status === "diproses").length,
      menunggu: tickets.filter((t) => t.status === "menunggu_customer").length,
      selesai: tickets.filter((t) => t.status === "selesai").length,
    };
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
              <Headphones className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">Admin Support</p>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Pusat Kelola Tiket Customer Care</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola pengaduan, klaim garansi, status tiket, dan eskalasi penanganan dukungan customer & agent.
          </p>
        </div>
        <button
          onClick={() => void fetchTickets()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 text-[#0F766E] ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tiket</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpiStats.total}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Diterima</p>
          <p className="mt-2 text-2xl font-bold text-blue-900">{kpiStats.diterima}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Diproses</p>
          <p className="mt-2 text-2xl font-bold text-amber-900">{kpiStats.diproses}</p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Menunggu</p>
          <p className="mt-2 text-2xl font-bold text-purple-900">{kpiStats.menunggu}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Selesai</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{kpiStats.selesai}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. tiket, nama pelapor, subjek, SN, invoice..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E]"
              >
                <option value="all">Semua Status</option>
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Kategori:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E]"
              >
                <option value="all">Semua Kategori</option>
                <option value="produk_rusak">Produk Rusak</option>
                <option value="barang_kurang_salah">Barang Kurang/Salah</option>
                <option value="keterlambatan_pengiriman">Keterlambatan Pengiriman</option>
                <option value="pembayaran">Pembayaran</option>
                <option value="garansi">Garansi</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">No. Tiket</th>
                <th className="px-4 py-3.5">Pelapor</th>
                <th className="px-4 py-3.5">Kategori / SN</th>
                <th className="px-4 py-3.5">Invoice / Produk</th>
                <th className="px-4 py-3.5">Subjek</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-[#0F766E]" />
                    Memuat daftar tiket...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Headphones className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada tiket ditemukan</p>
                    <p className="text-xs">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#0F766E]">
                      {t.ticket_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{t.reporter_name || `User #${t.user_id}`}</p>
                      {t.reporter_phone && (
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" /> {t.reporter_phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{formatLabel(t.category)}</p>
                      {t.serial_number ? (
                        <span className="mt-0.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          SN: {t.serial_number}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{t.invoice_number || "-"}</p>
                      <p className="text-xs text-slate-500">{t.product_name || "-"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900 max-w-xs truncate">{t.subject}</p>
                      {t.contact_channel && (
                        <p className="text-xs text-slate-400 capitalize">via {t.contact_channel}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(t.created_at).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => openDetail(t)}
                        className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-semibold text-[#0F766E] transition hover:bg-teal-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail & Status Update Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-4 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">Admin Ticket Management</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selectedTicket.ticket_number}</h2>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {formatLabel(selectedTicket.type)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-xl p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {detailLoading && (
                <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Memperbarui data detail tiket...
                </div>
              )}

              {/* Informational Cards Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Pelapor / Customer
                  </p>
                  <p className="text-base font-bold text-slate-900">{selectedTicket.reporter_name || `User #${selectedTicket.user_id}`}</p>
                  <p className="text-xs text-slate-600">Telepon: {selectedTicket.reporter_phone || "-"}</p>
                  <p className="text-xs text-slate-600">Channel Update: <span className="font-semibold capitalize">{selectedTicket.contact_channel || "whatsapp"}</span></p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Invoice & Produk
                  </p>
                  <p className="text-base font-bold text-slate-900">{selectedTicket.invoice_number || "Tanpa Invoice"}</p>
                  <p className="text-xs text-slate-600">Produk: <span className="font-semibold">{selectedTicket.product_name || "-"}</span></p>
                  <p className="text-xs text-slate-600">Kategori: <span className="font-semibold">{formatLabel(selectedTicket.category)}</span></p>
                </div>
              </div>

              {/* Serial Number & Subject */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Nomor Serial (SN)</span>
                  {selectedTicket.serial_number ? (
                    <span className="rounded bg-amber-200 px-2 py-0.5 font-mono text-sm font-bold text-amber-900">
                      {selectedTicket.serial_number}
                    </span>
                  ) : (
                    <span className="text-xs italic text-amber-600">Tidak dilampirkan</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subjek Tiket</p>
                  <p className="text-base font-semibold text-slate-900">{selectedTicket.subject}</p>
                </div>
                {selectedTicket.description && (
                  <div className="mt-2 border-t border-amber-200/60 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Deskripsi / Kronologi</p>
                    <p className="mt-1 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Attachments Preview */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-[#0F766E]" /> Bukti Lampiran ({selectedTicket.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {selectedTicket.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#0F766E]"
                      >
                        <ImageIcon className="h-4 w-4 text-[#0F766E]" />
                        Lampiran #{att.id}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#0F766E]" />
                  <h3 className="text-base font-bold text-slate-900">Update Status Tiket</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Pilih Status Baru
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as CustomerCareTicketStatus)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Catatan Penanganan / Internal Note
                    </label>
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Contoh: Sedang dicek oleh tim support teknis"
                      className="w-full min-h-[70px] resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-teal-200/60 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#115E59] disabled:bg-slate-300"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Simpan...
                      </>
                    ) : (
                      "Simpan Perubahan Status"
                    )}
                  </button>
                </div>
              </form>

              {/* Status History Logs */}
              {selectedTicket.logs && selectedTicket.logs.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#0F766E]" /> Riwayat Penanganan ({selectedTicket.logs.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedTicket.logs.map((log) => (
                      <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>{log.action}</span>
                          <span className="text-slate-400">{new Date(log.created_at).toLocaleString("id-ID")}</span>
                        </div>
                        {log.note && <p className="mt-1 text-slate-600">{log.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
