import {
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe2,
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
  type PreorderAnalyticsByPriceDto,
  type PreorderAnalyticsByProductDto,
  type PreorderAnalyticsByRegionDto,
  type PreorderAnalyticsResponse,
  type PreorderAnalyticsTopAgentDto,
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

/* ──────────── Constants & Colors ──────────── */

type PeriodOption = "day" | "week" | "month" | "custom";

const PERIOD_LABELS: Record<PeriodOption, string> = {
  day: "Hari Ini",
  week: "Minggu Ini",
  month: "Bulan Ini",
  custom: "Custom Range",
};

const CHART_COLORS = [
  "#0F766E",
  "#3B82F6",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#10B981",
  "#EF4444",
  "#6366F1",
  "#14B8A6",
  "#F97316",
];

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

/* ──────────── Component ──────────── */

export function PreorderAnalytics() {
  const [period, setPeriod] = useState<PeriodOption>("month");
  const [customStart, setCustomStart] = useState(getMonthStartStr());
  const [customEnd, setCustomEnd] = useState(getTodayStr());
  const [data, setData] = useState<PreorderAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"agents" | "products" | "region" | "price">("agents");

  /* ──── Search / Filter States for Tables ──── */
  const [agentSearch, setAgentSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");

  /* ──── Load Analytics Data ──── */
  const loadAnalytics = async () => {
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
      const res = await api.preordersAnalytics(params);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat analitik PO.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [period, customStart, customEnd]);

  /* ──── Computed Metrics ──── */
  const kpi = useMemo(() => {
    if (!data) return { totalRevenue: 0, totalQty: 0, totalCities: 0, totalAgents: 0 };
    const totalRevenue = (data.top_agents || []).reduce((acc, a) => acc + (a.revenue || 0), 0);
    const totalQty = (data.top_agents || []).reduce((acc, a) => acc + (a.total_qty || 0), 0);
    const totalCities = (data.by_region || []).length;
    const totalAgents = (data.top_agents || []).length;
    return { totalRevenue, totalQty, totalCities, totalAgents };
  }, [data]);

  /* ──── Period Display Label ──── */
  const periodLabel = useMemo(() => {
    if (!data) return "";
    const s = toLocalDate(data.start_date);
    const e = toLocalDate(data.end_date);
    return `${dateFmt.format(s)} — ${dateFmt.format(e)}`;
  }, [data]);

  /* ──── Filtered Agent Data ──── */
  const filteredAgents = useMemo(() => {
    const list = data?.top_agents || [];
    if (!agentSearch) return list;
    const q = agentSearch.toLowerCase();
    return list.filter((a) => a.agent_name?.toLowerCase().includes(q) || String(a.agent_id).includes(q));
  }, [data, agentSearch]);

  /* ──── Filtered Product Data ──── */
  const filteredProducts = useMemo(() => {
    const list = data?.by_product || [];
    if (!productSearch) return list;
    const q = productSearch.toLowerCase();
    return list.filter((p) => p.product_name?.toLowerCase().includes(q) || String(p.id_product).includes(q));
  }, [data, productSearch]);

  /* ──── Filtered Region Data ──── */
  const filteredRegions = useMemo(() => {
    const list = data?.by_region || [];
    if (!regionSearch) return list;
    const q = regionSearch.toLowerCase();
    return list.filter((r) => r.city?.toLowerCase().includes(q));
  }, [data, regionSearch]);

  /* ──── Export Excel (.xlsx) ──── */
  const exportExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Analitik
    const summaryAOA: (string | number)[][] = [
      ["ANALITIK PURCHASE ORDER (PO) - GMT GROUP"],
      ["Periode:", periodLabel],
      ["Tanggal Export:", dateTimeFmt.format(new Date())],
      [],
      ["METRIK UTAMA"],
      ["Total PO", data.total_po],
      ["Total Revenue", kpi.totalRevenue],
      ["Total Qty Terjual", kpi.totalQty],
      ["Total Agent Aktif", kpi.totalAgents],
      ["Total Wilayah", kpi.totalCities],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
    wsSummary["!cols"] = [{ wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

    // Sheet 2: Agent PO Terbanyak
    const agentHeaders = ["ID Agent", "Nama Agent", "Total PO", "Total Qty", "Revenue (Rp)"];
    const agentRows = (data.top_agents || []).map((a) => [
      a.agent_id,
      a.agent_name,
      a.total_po,
      a.total_qty,
      a.revenue,
    ]);
    const wsAgents = XLSX.utils.aoa_to_sheet([agentHeaders, ...agentRows]);
    wsAgents["!cols"] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsAgents, "Top Agent");

    // Sheet 3: Klasifikasi Produk
    const productHeaders = [
      "ID Produk",
      "Nama Produk",
      "Harga Satuan (Rp)",
      "Total PO",
      "Total Qty",
      "Gross Revenue (Rp)",
      "Net Revenue (Rp)",
    ];
    const productRows = (data.by_product || []).map((p) => [
      p.id_product,
      p.product_name,
      p.unit_price,
      p.total_po,
      p.total_qty,
      p.gross_revenue,
      p.net_revenue,
    ]);
    const wsProducts = XLSX.utils.aoa_to_sheet([productHeaders, ...productRows]);
    wsProducts["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsProducts, "Klasifikasi Produk");

    // Sheet 4: Klasifikasi Harga
    const priceHeaders = ["Harga Satuan (Rp)", "Total PO", "Total Qty", "Net Revenue (Rp)"];
    const priceRows = (data.by_price || []).map((pr) => [pr.price, pr.total_po, pr.total_qty, pr.net_revenue]);
    const wsPrice = XLSX.utils.aoa_to_sheet([priceHeaders, ...priceRows]);
    wsPrice["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsPrice, "Klasifikasi Harga");

    // Sheet 5: Sebaran Wilayah
    const regionHeaders = ["Kota / Wilayah", "Total PO", "Total Qty", "Net Revenue (Rp)"];
    const regionRows = (data.by_region || []).map((r) => [r.city, r.total_po, r.total_qty, r.net_revenue]);
    const wsRegion = XLSX.utils.aoa_to_sheet([regionHeaders, ...regionRows]);
    wsRegion["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsRegion, "Sebaran Wilayah");

    const dateStr = formatDateInput(new Date());
    XLSX.writeFile(wb, `Analitik_PO_GMT_${data.period}_${dateStr}.xlsx`);
  };

  /* ──── Custom Tooltips for Charts ──── */
  function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
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
        <p className="mb-1 text-xs font-medium text-slate-500">{payload[0].name}</p>
        <p className="text-sm font-bold text-slate-900">{currFmt.format(payload[0].value)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ──── Header ──── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics PO</h1>
            <p className="text-sm text-slate-500">Ringkasan agent terbanyak, klasifikasi produk, harga, dan wilayah</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void loadAnalytics()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportExcel}
            disabled={!data}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* ──── Period Filter Bar ──── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Period Tabs */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Periode</label>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {(Object.keys(PERIOD_LABELS) as PeriodOption[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    period === p
                      ? "bg-[#0F766E] text-white shadow-md shadow-teal-500/30"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
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

          {/* Period Display Label */}
          {data && (
            <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
              <Calendar className="h-4 w-4" />
              {periodLabel}
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
          <p className="mt-3 text-sm text-slate-500">Memuat analitik PO...</p>
        </div>
      )}

      {/* ──── Content ──── */}
      {!isLoading && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total PO",
                value: data.total_po.toLocaleString("id-ID"),
                icon: ShoppingCart,
                gradient: "from-teal-500 to-emerald-600",
                shadowColor: "shadow-teal-500/20",
              },
              {
                label: "Estimasi Net Revenue",
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
                label: "Total Wilayah / Kota",
                value: kpi.totalCities.toLocaleString("id-ID"),
                icon: MapPin,
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

          {/* ──── Visual Grid Overview ──── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Agents Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#0F766E]" />
                  <h2 className="text-base font-bold text-slate-900">Agent PO Terbanyak</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Top {(data.top_agents || []).length}</span>
              </div>
              {(data.top_agents || []).length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">Tidak ada data agent</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.top_agents} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}Jt` : v.toString())}
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                    />
                    <YAxis
                      dataKey="agent_name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11, fill: "#475569" }}
                    />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar dataKey="revenue" fill="#0F766E" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Region Revenue Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-[#0F766E]" />
                  <h2 className="text-base font-bold text-slate-900">Revenue per Wilayah (Kota)</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Total {(data.by_region || []).length} Kota</span>
              </div>
              {(data.by_region || []).length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">Tidak ada data wilayah</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.by_region}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="city" tick={{ fontSize: 11, fill: "#475569" }} />
                    <YAxis
                      tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}Jt` : v.toString())}
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                    />
                    <Tooltip content={<CurrencyTooltip />} cursor={{ fill: "rgba(15,118,110,0.06)" }} />
                    <Bar dataKey="net_revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ──── Analytics Breakdown Tabs & Tables ──── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Tab Selector Bar */}
            <div className="border-b border-slate-200 px-4 pt-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "agents", label: "Top Agent", icon: Users, count: (data.top_agents || []).length },
                  { id: "products", label: "Klasifikasi Produk", icon: Package, count: (data.by_product || []).length },
                  { id: "region", label: "Sebaran Wilayah", icon: MapPin, count: (data.by_region || []).length },
                  { id: "price", label: "Klasifikasi Harga", icon: Tag, count: (data.by_price || []).length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                      activeTab === tab.id
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

            {/* TAB CONTENT 1: AGENTS */}
            {activeTab === "agents" && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari agent..."
                      value={agentSearch}
                      onChange={(e) => setAgentSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

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
                      {filteredAgents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                            Tidak ada data agent
                          </td>
                        </tr>
                      ) : (
                        filteredAgents.map((ag) => (
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

            {/* TAB CONTENT 2: PRODUCTS */}
            {activeTab === "products" && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

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
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                            Tidak ada data produk
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
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

            {/* TAB CONTENT 3: REGION */}
            {activeTab === "region" && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari wilayah/kota..."
                      value={regionSearch}
                      onChange={(e) => setRegionSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

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
                      {filteredRegions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                            Tidak ada data wilayah
                          </td>
                        </tr>
                      ) : (
                        filteredRegions.map((r, idx) => (
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

            {/* TAB CONTENT 4: PRICE */}
            {activeTab === "price" && (
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
                      {(data.by_price || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                            Tidak ada data harga
                          </td>
                        </tr>
                      ) : (
                        (data.by_price || []).map((pr, idx) => (
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
        </>
      )}
    </div>
  );
}
