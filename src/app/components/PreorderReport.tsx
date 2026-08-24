import {
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe2,
  Layers,
  Loader2,
  MapPin,
  Package,
  PieChart as PieIcon,
  RefreshCw,
  Search,
  ShoppingCart,
  Tag,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import {
  api,
  type PreorderAnalyticsResponse,
  type PreorderReportItemDto,
  type PreorderReportResponse,
} from "../services/api";

/* ──────────── Formatters ──────────── */

const currFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

/* ──────────── Constants ──────────── */

type PeriodOption = "day" | "week" | "month" | "custom";

const PERIOD_LABELS: Record<PeriodOption, string> = {
  day: "Hari Ini",
  week: "Minggu Ini",
  month: "Bulan Ini",
  custom: "Custom Range",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  approve: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  in_review: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  shipped: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  barang_sudah_terkirim: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  invalid: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  unpaid: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  partial: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  expired: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  failed: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  refund: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

const PIE_COLORS = ["#0F766E", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899", "#10B981", "#6366F1"];

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const style = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  const displayLabel = label ?? status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ring-black/5 ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {displayLabel}
    </span>
  );
}

/* ──────────── Helpers ──────────── */

function toLocalDate(isoDate: string) {
  try {
    return new Date(isoDate);
  } catch {
    return new Date();
  }
}

function formatDateInput(d: Date) {
  return d.toISOString().split("T")[0];
}

function getTodayStr() {
  return formatDateInput(new Date());
}

function getMonthStartStr() {
  const d = new Date();
  d.setDate(1);
  return formatDateInput(d);
}

/* ──────────── Postal Code to City Name Resolver ──────────── */

const SPECIFIC_POSTAL_CODES: Record<string, string> = {
  "10150": "Jakarta Pusat",
  "11320": "Jakarta Barat",
  "11480": "Jakarta Barat",
  "11510": "Jakarta Barat",
  "11610": "Jakarta Barat",
  "11620": "Jakarta Barat",
  "11630": "Jakarta Barat",
  "13470": "Jakarta Timur",
  "15000": "Tangerang",
  "15135": "Tangerang",
  "15141": "Tangerang",
  "15159": "Tangerang",
};

export function formatCityName(val: string | null | undefined, address?: string | null): string {
  if (!val || val.trim() === "" || val === "-") return "-";
  const trimmed = val.trim();

  // 1. Exact match in specific postal code map
  if (SPECIFIC_POSTAL_CODES[trimmed]) {
    return SPECIFIC_POSTAL_CODES[trimmed];
  }

  // 2. Pure 5-digit number or postal code prefix logic
  if (/^\d{5}$/.test(trimmed)) {
    const prefix = trimmed.substring(0, 2);
    switch (prefix) {
      case "10": return "Jakarta Pusat";
      case "11": return "Jakarta Barat";
      case "12": return "Jakarta Selatan";
      case "13": return "Jakarta Timur";
      case "14": return "Jakarta Utara";
      case "15": return "Tangerang";
      case "16": return "Bogor / Depok";
      case "17": return "Bekasi";
      case "18": return "Banten / Serang";
      case "20": return "Medan";
      case "25": return "Padang";
      case "28": return "Pekanbaru";
      case "29": return "Batam";
      case "30": return "Palembang";
      case "35": return "Bandar Lampung";
      case "40": return "Bandung";
      case "41": return "Purwakarta";
      case "42": return "Serang";
      case "43": return "Sukabumi";
      case "45": return "Cirebon";
      case "50": return "Semarang";
      case "51": return "Pekalongan";
      case "52": return "Tegal";
      case "53": return "Purwokerto";
      case "55": return "Yogyakarta";
      case "56": return "Magelang";
      case "57": return "Surakarta / Solo";
      case "60": return "Surabaya";
      case "61": return "Sidoarjo";
      case "62": return "Tuban";
      case "63": return "Madiun";
      case "64": return "Kediri";
      case "65": return "Malang";
      case "68": return "Jember";
      case "80": return "Denpasar";
      case "83": return "Mataram";
      case "90": return "Makassar";
      default: return `Kota (${trimmed})`;
    }
  }

  // 3. If numeric but not 5-digit (e.g. ID or other number)
  if (/^\d+$/.test(trimmed)) {
    if (address) {
      const match = address.match(/(Jakarta\s+(?:Pusat|Barat|Selatan|Timur|Utara)|Tangerang(?:\s+Selatan)?|Bekasi|Bogor|Depok|Bandung|Surabaya|Yogyakarta|Semarang|Medan|Makassar|Denpasar)/i);
      if (match) return match[0];
    }
    return `Wilayah ${trimmed}`;
  }

  return trimmed;
}

/* ──────────── Main Component ──────────── */

export function PreorderReport() {
  const [period, setPeriod] = useState<PeriodOption>("month");
  const [customStart, setCustomStart] = useState(getMonthStartStr());
  const [customEnd, setCustomEnd] = useState(getTodayStr());

  /* ──── State ──── */
  const [reportData, setReportData] = useState<PreorderReportResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PreorderAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  /* ──── Page View Mode Tabs ──── */
  const [mainTab, setMainTab] = useState<"all" | "analytics" | "list">("all");
  const [analyticsTab, setAnalyticsTab] = useState<"agents" | "products" | "region" | "price">("agents");

  /* ──── Table Filters ──── */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedPO, setSelectedPO] = useState<PreorderReportItemDto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const ITEMS_PER_PAGE = 10;

  /* ──── Load Unified Data ──── */
  const loadUnifiedData = async () => {
    setIsLoading(true);
    setError("");
    try {
      let params: { period?: string; start_date?: string; end_date?: string };
      if (period === "custom") {
        if (!customStart || !customEnd) {
          setError("start_date and end_date must be provided together");
          setIsLoading(false);
          return;
        }
        params = { start_date: customStart, end_date: customEnd };
      } else {
        params = { period };
      }

      // Fetch both endpoints in parallel for synchronization
      const [rep, ana] = await Promise.all([
        api.preordersReport(params).catch(() => null),
        api.preordersAnalytics(params).catch(() => null),
      ]);

      setReportData(rep);
      setAnalyticsData(ana);
      setCurrentPage(1);

      if (!rep && !ana) {
        setError("Gagal memuat data laporan & analitik PO.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data laporan PO.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUnifiedData();
  }, [period, customStart, customEnd]);

  /* ──── Computed Data for PO List ──── */
  const preorders = reportData?.preorders ?? [];

  const filteredPreorders = useMemo(() => {
    return preorders.filter((po) => {
      if (statusFilter !== "all" && po.last_po_status !== statusFilter) return false;
      if (paymentFilter !== "all" && po.payment_status !== paymentFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchPO = po.po_number?.toLowerCase().includes(q);
        const matchBuyer = po.buyer_name?.toLowerCase().includes(q);
        const matchCompany = po.buyer_company?.toLowerCase().includes(q);
        const matchAgent = po.agent_name?.toLowerCase().includes(q);
        const matchProduct = po.product_names?.some((n) => n.toLowerCase().includes(q));
        if (!matchPO && !matchBuyer && !matchCompany && !matchAgent && !matchProduct) return false;
      }
      return true;
    });
  }, [preorders, statusFilter, paymentFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPreorders.length / ITEMS_PER_PAGE));
  const pagedPreorders = filteredPreorders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* ──── Formatted & Grouped Regions (City Names) ──── */
  const formattedRegions = useMemo(() => {
    const list = analyticsData?.by_region || [];
    const map = new Map<string, { city: string; rawCities: string[]; total_po: number; total_qty: number; net_revenue: number }>();

    list.forEach((r) => {
      const cityName = formatCityName(r.city);
      const existing = map.get(cityName);
      if (existing) {
        existing.total_po += r.total_po || 0;
        existing.total_qty += r.total_qty || 0;
        existing.net_revenue += r.net_revenue || 0;
        if (!existing.rawCities.includes(r.city)) {
          existing.rawCities.push(r.city);
        }
      } else {
        map.set(cityName, {
          city: cityName,
          rawCities: [r.city],
          total_po: r.total_po || 0,
          total_qty: r.total_qty || 0,
          net_revenue: r.net_revenue || 0,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.net_revenue - a.net_revenue);
  }, [analyticsData]);

  /* ──── KPI Summary ──── */
  const kpi = useMemo(() => {
    const totalPO = reportData?.total_po ?? analyticsData?.total_po ?? preorders.length;
    const totalRevenue = preorders.reduce((s, po) => s + (po.total || 0), 0) ||
      (analyticsData?.top_agents || []).reduce((acc, a) => acc + (a.revenue || 0), 0);
    const totalQty = preorders.reduce((s, po) => s + (po.total_qty || 0), 0) ||
      (analyticsData?.top_agents || []).reduce((acc, a) => acc + (a.total_qty || 0), 0);
    const uniqueAgents = new Set(preorders.map((po) => po.agent_id)).size || (analyticsData?.top_agents || []).length;
    const totalCities = formattedRegions.length;
    const avgOrder = totalPO > 0 ? totalRevenue / totalPO : 0;
    return { totalPO, totalRevenue, totalQty, uniqueAgents, totalCities, avgOrder };
  }, [reportData, analyticsData, preorders, formattedRegions]);

  /* ──── Daily Revenue Chart ──── */
  const dailyRevenueData = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; count: number }>();
    preorders.forEach((po) => {
      const d = toLocalDate(po.created_at);
      const key = formatDateInput(d);
      const existing = map.get(key);
      if (existing) {
        existing.revenue += po.total || 0;
        existing.count += 1;
      } else {
        map.set(key, { date: key, revenue: po.total || 0, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [preorders]);

  /* ──── Status & Payment Distribution ──── */
  const statusDistribution = useMemo(() => {
    const map = new Map<string, number>();
    preorders.forEach((po) => {
      const s = po.last_po_status || "unknown";
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
      key: name,
    }));
  }, [preorders]);

  const paymentDistribution = useMemo(() => {
    const map = new Map<string, number>();
    preorders.forEach((po) => {
      const s = po.payment_status || "unknown";
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
      key: name,
    }));
  }, [preorders]);

  /* ──── Unique Filter Lists ──── */
  const uniqueStatuses = useMemo(() => {
    return [...new Set(preorders.map((po) => po.last_po_status).filter(Boolean))];
  }, [preorders]);

  const uniquePaymentStatuses = useMemo(() => {
    return [...new Set(preorders.map((po) => po.payment_status).filter(Boolean))];
  }, [preorders]);

  /* ──── Master Excel Export (.xlsx) ──── */
  const exportMasterExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan & Stats Utama
    const summaryAOA: (string | number)[][] = [
      ["LAPORAN & ANALITIK PURCHASE ORDER (PO) - GMT GROUP"],
      ["Periode Laporan:", periodLabel],
      ["Tanggal Export:", dateTimeFmt.format(new Date())],
      ["Filter Status PO:", statusFilter === "all" ? "Semua Status" : statusFilter],
      ["Filter Pembayaran:", paymentFilter === "all" ? "Semua Pembayaran" : paymentFilter],
      [],
      ["RINGKASAN METRIK UTAMA"],
      ["Indikator", "Nilai"],
      ["Total PO", kpi.totalPO],
      ["Total Revenue", kpi.totalRevenue],
      ["Total Qty Terjual", kpi.totalQty],
      ["Rata-rata Order", kpi.avgOrder],
      ["Total Agent Aktif", kpi.uniqueAgents],
      ["Total Wilayah", kpi.totalCities],
      [],
      ["DISTRIBUSI STATUS PO"],
      ["Status PO", "Jumlah PO", "Persentase (%)"],
      ...statusDistribution.map((st) => [
        st.name,
        st.value,
        preorders.length > 0 ? ((st.value / preorders.length) * 100).toFixed(1) + "%" : "0%",
      ]),
      [],
      ["DISTRIBUSI STATUS PEMBAYARAN"],
      ["Status Pembayaran", "Jumlah PO", "Persentase (%)"],
      ...paymentDistribution.map((pm) => [
        pm.name,
        pm.value,
        preorders.length > 0 ? ((pm.value / preorders.length) * 100).toFixed(1) + "%" : "0%",
      ]),
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
    wsSummary["!cols"] = [{ wch: 32 }, { wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan & Stats");

    // Sheet 2: Data PO Lengkap
    if (filteredPreorders.length > 0) {
      const poHeaders = [
        "No. PO",
        "Tanggal & Waktu",
        "Buyer / Customer",
        "Perusahaan",
        "Kota Pengiriman",
        "Alamat",
        "Daftar Produk",
        "Total Qty",
        "Subtotal (Rp)",
        "Total (Rp)",
        "Status PO",
        "Status Bayar",
        "Status Kirim",
        "ID Agent",
        "Nama Agent",
      ];
      const poRows = filteredPreorders.map((po) => [
        po.po_number || "",
        toLocalDate(po.created_at).toLocaleString("id-ID"),
        po.buyer_name || "",
        po.buyer_company || "-",
        formatCityName(po.shipping_city, po.address),
        po.address || "-",
        po.product_names?.join(", ") || "-",
        po.total_qty || 0,
        po.subtotal || 0,
        po.total || 0,
        po.last_po_status || "-",
        po.payment_status || "-",
        po.shipping_status || "-",
        po.agent_id || "",
        po.agent_name || "-",
      ]);
      const wsPO = XLSX.utils.aoa_to_sheet([poHeaders, ...poRows]);
      wsPO["!cols"] = [
        { wch: 26 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 18 },
        { wch: 35 }, { wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, wsPO, "Data PO Lengkap");
    }

    // Sheet 3: Rincian Item Produk
    const itemRows: (string | number)[][] = [];
    filteredPreorders.forEach((po) => {
      if (po.products && po.products.length > 0) {
        po.products.forEach((p) => {
          itemRows.push([
            po.po_number || "",
            toLocalDate(po.created_at).toLocaleDateString("id-ID"),
            po.buyer_name || "",
            po.buyer_company || "-",
            po.agent_name || "-",
            p.id_product || "",
            p.name || "-",
            p.unit_price || 0,
            p.qty || 0,
            p.subtotal || 0,
            p.total || 0,
            po.last_po_status || "-",
            po.payment_status || "-",
          ]);
        });
      }
    });
    if (itemRows.length > 0) {
      const itemHeaders = [
        "No. PO", "Tanggal", "Buyer", "Perusahaan", "Nama Agent",
        "ID Produk", "Nama Produk", "Harga Satuan (Rp)", "Qty Item",
        "Subtotal Item (Rp)", "Total Line Item (Rp)", "Status PO", "Status Bayar",
      ];
      const wsItems = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
      wsItems["!cols"] = [
        { wch: 26 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 20 },
        { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 18 },
        { wch: 18 }, { wch: 15 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, wsItems, "Rincian Item Produk");
    }

    // Sheet 4: Top Agents
    if (analyticsData?.top_agents && analyticsData.top_agents.length > 0) {
      const agentHeaders = ["ID Agent", "Nama Agent", "Total PO", "Total Qty", "Revenue (Rp)"];
      const agentRows = analyticsData.top_agents.map((a) => [
        a.agent_id, a.agent_name, a.total_po, a.total_qty, a.revenue,
      ]);
      const wsAgents = XLSX.utils.aoa_to_sheet([agentHeaders, ...agentRows]);
      wsAgents["!cols"] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsAgents, "Top Agents");
    }

    // Sheet 5: Klasifikasi Produk
    if (analyticsData?.by_product && analyticsData.by_product.length > 0) {
      const prodHeaders = [
        "ID Produk", "Nama Produk", "Harga Satuan (Rp)", "Total PO", "Total Qty", "Gross Revenue (Rp)", "Net Revenue (Rp)",
      ];
      const prodRows = analyticsData.by_product.map((p) => [
        p.id_product, p.product_name, p.unit_price, p.total_po, p.total_qty, p.gross_revenue, p.net_revenue,
      ]);
      const wsProd = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
      wsProd["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsProd, "Klasifikasi Produk");
    }

    // Sheet 6: Sebaran Wilayah
    if (formattedRegions.length > 0) {
      const regHeaders = ["Kota / Wilayah", "Total PO", "Total Qty", "Net Revenue (Rp)"];
      const regRows = formattedRegions.map((r) => [r.city, r.total_po, r.total_qty, r.net_revenue]);
      const wsReg = XLSX.utils.aoa_to_sheet([regHeaders, ...regRows]);
      wsReg["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsReg, "Sebaran Wilayah");
    }

    // Sheet 7: Klasifikasi Harga
    if (analyticsData?.by_price && analyticsData.by_price.length > 0) {
      const prHeaders = ["Harga Satuan (Rp)", "Total PO", "Total Qty", "Net Revenue (Rp)"];
      const prRows = analyticsData.by_price.map((pr) => [pr.price, pr.total_po, pr.total_qty, pr.net_revenue]);
      const wsPr = XLSX.utils.aoa_to_sheet([prHeaders, ...prRows]);
      wsPr["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsPr, "Klasifikasi Harga");
    }

    const dateStr = formatDateInput(new Date());
    const fileName = `Laporan_dan_Analitik_PO_GMT_${reportData?.period || period}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  /* ──── CSV Export ──── */
  const exportCSV = () => {
    if (!filteredPreorders.length) return;
    const headers = [
      "No. PO", "Buyer", "Perusahaan", "Kota", "Produk", "Qty", "Subtotal", "Total", "Status PO", "Status Bayar", "Status Kirim", "Agent", "Tanggal",
    ];
    const rows = filteredPreorders.map((po) => [
      po.po_number, po.buyer_name, po.buyer_company, po.shipping_city, po.product_names?.join("; ") || "", po.total_qty, po.subtotal, po.total, po.last_po_status, po.payment_status, po.shipping_status, po.agent_name, toLocalDate(po.created_at).toISOString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_po_${reportData?.period || "custom"}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ──── Period Label ──── */
  const periodLabel = useMemo(() => {
    const s = reportData?.start_date || analyticsData?.start_date;
    const e = reportData?.end_date || analyticsData?.end_date;
    if (!s || !e) return "";
    return `${dateFmt.format(toLocalDate(s))} — ${dateFmt.format(toLocalDate(e))}`;
  }, [reportData, analyticsData]);

  /* ──── Chart Tooltips ──── */
  function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900">{currFmt.format(payload[0].value)}</p>
      </div>
    );
  }

  function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <p className="mb-1 text-xs font-medium capitalize text-slate-500">{payload[0].name}</p>
        <p className="text-sm font-bold text-slate-900">{payload[0].value} PO</p>
      </div>
    );
  }

  /* ──────────────────────────── RENDER ──────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ──── Header ──── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Report & Analytics PO</h1>
            <p className="text-sm text-slate-500">Laporan terpadu Purchase Order & Analitik Performa Sales/Agent</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void loadUnifiedData()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportMasterExcel}
            disabled={!reportData && !analyticsData}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel Master (.xlsx)
          </button>
        </div>
      </div>

      {/* ──── Filter Periode & View Tabs ──── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        {/* Top View Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {[
              { id: "all", label: "Laporan Lengkap", icon: Layers },
              { id: "analytics", label: "Grafik & Analitik", icon: BarChart3 },
              { id: "list", label: "Daftar PO", icon: ShoppingCart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id as typeof mainTab)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mainTab === tab.id
                    ? "bg-[#0F766E] text-white shadow-md shadow-teal-500/30"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {periodLabel && (
            <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
              <Calendar className="h-4 w-4 text-[#0F766E]" />
              {periodLabel}
            </div>
          )}
        </div>

        {/* Period Selector Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Pilih Periode</label>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {(Object.keys(PERIOD_LABELS) as PeriodOption[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    period === p
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {period === "custom" && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Dari</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sampai</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ──── Error Banner ──── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ──── Loading State ──── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#0F766E]" />
          <p className="mt-3 text-sm text-slate-500">Memuat laporan & analitik PO...</p>
        </div>
      )}

      {/* ──── Content View ──── */}
      {!isLoading && (reportData || analyticsData) && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total PO",
                value: kpi.totalPO.toLocaleString("id-ID"),
                icon: ClipboardList,
                gradient: "from-teal-500 to-emerald-600",
                shadowColor: "shadow-teal-500/20",
              },
              {
                label: "Total Revenue",
                value: currFmt.format(kpi.totalRevenue),
                icon: DollarSign,
                gradient: "from-blue-500 to-indigo-600",
                shadowColor: "shadow-blue-500/20",
              },
              {
                label: "Total Qty Terjual",
                value: kpi.totalQty.toLocaleString("id-ID"),
                icon: Package,
                gradient: "from-amber-500 to-orange-600",
                shadowColor: "shadow-amber-500/20",
              },
              {
                label: "Rata-rata Order",
                value: currFmt.format(kpi.avgOrder),
                icon: TrendingUp,
                gradient: "from-purple-500 to-fuchsia-600",
                shadowColor: "shadow-purple-500/20",
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-lg ${card.shadowColor}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-md ${card.shadowColor}`}
                  >
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION: ANALYTICS & CHARTS */}
          {(mainTab === "all" || mainTab === "analytics") && (
            <div className="space-y-6">
              {/* Daily Revenue Bar + Pie Charts */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Revenue Timeline */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#0F766E]" />
                      <h2 className="text-base font-bold text-slate-900">Grafik Revenue Harian</h2>
                    </div>
                  </div>
                  {dailyRevenueData.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-sm text-slate-400">Tidak ada data grafik</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={dailyRevenueData} barSize={dailyRevenueData.length > 15 ? 16 : 32}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0F766E" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v: string) => {
                            try { return shortDateFmt.format(new Date(v)); } catch { return v; }
                          }}
                          tick={{ fontSize: 11, fill: "#94A3B8" }}
                        />
                        <YAxis
                          tickFormatter={(v: number) => {
                            if (v >= 1e9) return `${(v / 1e9).toFixed(1)}M`;
                            if (v >= 1e6) return `${(v / 1e6).toFixed(1)}Jt`;
                            if (v >= 1e3) return `${(v / 1e3).toFixed(0)}rb`;
                            return v.toString();
                          }}
                          tick={{ fontSize: 11, fill: "#94A3B8" }}
                          width={55}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15,118,110,0.06)" }} />
                        <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Status & Payment Pies */}
                <div className="flex flex-col gap-6">
                  {/* PO Status Pie */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-3 text-base font-bold text-slate-900">Distribusi Status PO</h2>
                    {statusDistribution.length === 0 ? (
                      <div className="flex h-36 items-center justify-center text-sm text-slate-400">Tidak ada data</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={170}>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {statusDistribution.map((_entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend
                            formatter={(value) => <span className="text-xs capitalize text-slate-600">{value}</span>}
                            iconType="circle"
                            iconSize={8}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Payment Status Pie */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-3 text-base font-bold text-slate-900">Distribusi Status Pembayaran</h2>
                    {paymentDistribution.length === 0 ? (
                      <div className="flex h-36 items-center justify-center text-sm text-slate-400">Tidak ada data</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={170}>
                        <PieChart>
                          <Pie
                            data={paymentDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {paymentDistribution.map((_entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={PIE_COLORS[(idx + 2) % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend
                            formatter={(value) => <span className="text-xs capitalize text-slate-600">{value}</span>}
                            iconType="circle"
                            iconSize={8}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Analytics Data Breakdown Tabs & Tables */}
              {analyticsData && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "agents", label: "Top Agent PO", icon: Users, count: (analyticsData.top_agents || []).length },
                        { id: "products", label: "Klasifikasi Produk", icon: Package, count: (analyticsData.by_product || []).length },
                        { id: "region", label: "Sebaran Wilayah", icon: MapPin, count: (analyticsData.by_region || []).length },
                        { id: "price", label: "Klasifikasi Harga", icon: Tag, count: (analyticsData.by_price || []).length },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setAnalyticsTab(tab.id as typeof analyticsTab)}
                          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                            analyticsTab === tab.id
                              ? "border-[#0F766E] text-[#0F766E]"
                              : "border-transparent text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <tab.icon className="h-4 w-4" />
                          {tab.label}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TAB 1: AGENTS */}
                  {analyticsTab === "agents" && (
                    <div className="p-4 space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                              <th className="px-4 py-3 font-semibold text-slate-500">ID Agent</th>
                              <th className="px-4 py-3 font-semibold text-slate-500">Nama Agent</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total PO</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total Qty</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Revenue (Rp)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(analyticsData.top_agents || []).length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Tidak ada data agent</td>
                              </tr>
                            ) : (
                              analyticsData.top_agents.map((ag) => (
                                <tr key={ag.agent_id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{ag.agent_id}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-900">{ag.agent_name}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-700">{ag.total_po}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-700">{ag.total_qty}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0F766E]">{currFmt.format(ag.revenue)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PRODUCTS */}
                  {analyticsTab === "products" && (
                    <div className="p-4 space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                              <th className="px-4 py-3 font-semibold text-slate-500">ID Produk</th>
                              <th className="px-4 py-3 font-semibold text-slate-500">Nama Produk</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Harga Satuan</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total PO</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total Qty</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Gross Revenue</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Net Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(analyticsData.by_product || []).length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">Tidak ada data produk</td>
                              </tr>
                            ) : (
                              analyticsData.by_product.map((p) => (
                                <tr key={p.id_product} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{p.id_product}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-900">{p.product_name}</td>
                                  <td className="px-4 py-3 text-right text-slate-600">{currFmt.format(p.unit_price)}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-700">{p.total_po}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-700">{p.total_qty}</td>
                                  <td className="px-4 py-3 text-right text-slate-600">{currFmt.format(p.gross_revenue)}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0F766E]">{currFmt.format(p.net_revenue)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: REGION */}
                  {analyticsTab === "region" && (
                    <div className="p-4 space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                              <th className="px-4 py-3 font-semibold text-slate-500">Kota / Wilayah</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total PO</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total Qty</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Net Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {formattedRegions.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">Tidak ada data wilayah</td>
                              </tr>
                            ) : (
                              formattedRegions.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{r.city}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-700">{r.total_po}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-700">{r.total_qty}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0F766E]">{currFmt.format(r.net_revenue)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PRICE */}
                  {analyticsTab === "price" && (
                    <div className="p-4 space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                              <th className="px-4 py-3 font-semibold text-slate-500">Harga Satuan</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total PO</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total Qty</th>
                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Net Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(analyticsData.by_price || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">Tidak ada data harga</td>
                              </tr>
                            ) : (
                              analyticsData.by_price.map((pr, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{currFmt.format(pr.price)}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-700">{pr.total_po}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-700">{pr.total_qty}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0F766E]">{currFmt.format(pr.net_revenue)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION: DATA TABLE FOR PURCHASE ORDERS */}
          {(mainTab === "all" || mainTab === "list") && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Table Header & Filters */}
              <div className="border-b border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-[#0F766E]" />
                    <h2 className="text-base font-bold text-slate-900">Daftar Purchase Order</h2>
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                      {filteredPreorders.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari PO, buyer, agent..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 sm:w-64"
                      />
                    </div>

                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowFilterPanel(!showFilterPanel)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        showFilterPanel || statusFilter !== "all" || paymentFilter !== "all"
                          ? "border-teal-200 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                      {(statusFilter !== "all" || paymentFilter !== "all") && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F766E] text-[10px] font-bold text-white">
                          {(statusFilter !== "all" ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0)}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={exportCSV}
                      disabled={!filteredPreorders.length}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      CSV
                    </button>
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilterPanel && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Status PO</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#0F766E]"
                      >
                        <option value="all">Semua Status</option>
                        {uniqueStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Status Bayar</label>
                      <select
                        value={paymentFilter}
                        onChange={(e) => {
                          setPaymentFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#0F766E]"
                      >
                        <option value="all">Semua Pembayaran</option>
                        {uniquePaymentStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(statusFilter !== "all" || paymentFilter !== "all") && (
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setPaymentFilter("all");
                          setCurrentPage(1);
                        }}
                        className="mt-4 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <X className="h-3 w-3" />
                        Reset Filter
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 font-semibold text-slate-500">No. PO</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Buyer / Perusahaan</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Produk</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-right">Qty</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-center">Status PO</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-center">Bayar</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Agent</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Tanggal</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedPreorders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-16 text-center text-slate-400">
                          <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                          <p className="font-medium">Tidak ada data PO</p>
                          <p className="mt-1 text-xs">Coba ubah filter atau periode pencarian</p>
                        </td>
                      </tr>
                    ) : (
                      pagedPreorders.map((po) => (
                        <tr key={po.id} className="group transition hover:bg-teal-50/30">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-[#0F766E]">{po.po_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{po.buyer_name}</p>
                            <p className="text-xs text-slate-500">{po.buyer_company}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(po.product_names || []).slice(0, 2).map((name, i) => (
                                <span key={i} className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                  {name}
                                </span>
                              ))}
                              {(po.product_names?.length || 0) > 2 && (
                                <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                  +{po.product_names.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">{po.total_qty}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{currFmt.format(po.total)}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={po.last_po_status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={po.payment_status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{po.agent_name}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{dateTimeFmt.format(toLocalDate(po.created_at))}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedPO(po)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#0F766E] transition hover:bg-teal-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredPreorders.length)} dari {filteredPreorders.length} PO
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                            currentPage === pageNum
                              ? "bg-[#0F766E] text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ──── PO Detail Modal ──── */}
      {selectedPO && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPO(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4">
              <div>
                <p className="text-xs font-medium text-teal-100">Detail Purchase Order</p>
                <p className="text-lg font-bold text-white">{selectedPO.po_number}</p>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Buyer</label>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedPO.buyer_name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Perusahaan</label>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedPO.buyer_company || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kota</label>
                  <p className="mt-1 text-sm text-slate-700">{formatCityName(selectedPO.shipping_city, selectedPO.address)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Agent</label>
                  <p className="mt-1 text-sm text-slate-700">{selectedPO.agent_name}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alamat</label>
                  <p className="mt-1 text-sm text-slate-700">{selectedPO.address || "-"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status PO</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedPO.last_po_status} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pembayaran</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedPO.payment_status} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pengiriman</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedPO.shipping_status} />
                  </div>
                </div>
              </div>

              {selectedPO.products && selectedPO.products.length > 0 && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Produk</label>
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Produk</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Harga</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Qty</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPO.products.map((prod, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{prod.name}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{currFmt.format(prod.unit_price)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{prod.qty}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{currFmt.format(prod.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                          <td colSpan={2} className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Subtotal
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{selectedPO.total_qty}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{currFmt.format(selectedPO.subtotal)}</td>
                        </tr>
                        <tr className="bg-gradient-to-r from-teal-50 to-emerald-50">
                          <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-bold uppercase text-[#0F766E]">
                            Total
                          </td>
                          <td className="px-4 py-2.5 text-right text-base font-bold text-[#0F766E]">{currFmt.format(selectedPO.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Tanggal Dibuat</p>
                <p className="text-sm font-semibold text-slate-700">{dateTimeFmt.format(toLocalDate(selectedPO.created_at))}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
